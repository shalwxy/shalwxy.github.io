#!/usr/bin/env node
// 서브블로그별 "최근 댓글/좋아요" 패널(_includes/head/custom.html의 persica-activity)이 읽는
// assets/data/recent-activity-<subblog>.json을 GitHub Discussions(giscus)에서 긁어와 만든다.
// .github/workflows/recent-activity.yml이 주기 실행 + 수동 실행(workflow_dispatch)으로 이 스크립트를 돌린다.
//
// 아래 OWNER/REPO/CATEGORY_ID/SUB_BLOGS/SITE_URL은 _config.yml(comments.giscus, sub_blogs, url)과
// 같은 값을 그대로 옮겨 적은 것이다 — Jekyll 빌드 밖(Node 스크립트)에서 돌기 때문에 YAML을 직접
// 파싱하는 대신 중복해서 박아둔다. _config.yml 쪽 값을 바꾸면 여기도 같이 바꿔야 한다.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OWNER = 'shalwxy';
const REPO = 'shalwxy.github.io';
const CATEGORY_ID = 'DIC_kwDOPm0RSs4CuxMV';
const SUB_BLOGS = ['lab', 'essay', 'playground', 'backstage', 'draft'];
const SITE_URL = 'https://persica.co.kr';
const ITEMS_PER_SUBBLOG = 20;
const DATA_DIR = path.join('assets', 'data');

const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error('GITHUB_TOKEN 환경변수가 필요합니다.');
}

const QUERY = `
  query($owner: String!, $repo: String!, $category: ID!) {
    repository(owner: $owner, name: $repo) {
      discussions(categoryId: $category, first: 50, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          url
          comments(last: 10) {
            nodes {
              url
              createdAt
              bodyText
              author { login }
            }
          }
          reactions(last: 10) {
            nodes {
              content
              createdAt
              user { login }
            }
          }
        }
      }
    }
  }
`;

async function fetchDiscussions() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'persica-recent-activity-script',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner: OWNER, repo: REPO, category: CATEGORY_ID },
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL 요청 실패: ${res.status} ${await res.text()}`);
  }

  const { data, errors } = await res.json();
  if (errors) {
    throw new Error(`GitHub GraphQL 에러: ${JSON.stringify(errors)}`);
  }
  return data.repository.discussions.nodes;
}

// discussion_term이 "pathname"이라 discussion 제목이 곧 글 경로다 (예: "/lab/engineering/foo/").
function subBlogOf(title) {
  const match = /^\/([^/]+)\//.exec(title ?? '');
  return match && SUB_BLOGS.includes(match[1]) ? match[1] : null;
}

function truncate(text, max) {
  if (!text) return '';
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

// giscus는 discussion_term(pathname)과 제목이 "정확히" 같은 discussion을 그 글의 댓글창으로 쓴다.
// 하지만 이 저장소는 "누구나 discussion 생성 가능"이 켜져 있어야 giscus가 동작하므로, 아무 GitHub
// 계정이나 실제 글과 똑같은 제목(경로)으로 또 다른 discussion을 만들 수 있다. 그런 가짜 discussion의
// 댓글/반응을 진짜 글의 것처럼 섞어 보여주지 않도록, 제목이 완전히 같은 discussion들 중
// 번호(number)가 가장 작은(=가장 먼저 만들어진) 것만 그 경로의 "진짜" discussion으로 신뢰한다.
function pickCanonicalDiscussions(discussions) {
  const byTitle = new Map();
  for (const discussion of discussions) {
    const existing = byTitle.get(discussion.title);
    if (!existing || discussion.number < existing.number) {
      byTitle.set(discussion.title, discussion);
    }
  }
  return [...byTitle.values()];
}

async function main() {
  const discussions = await fetchDiscussions();
  console.log(`[recent-activity] 카테고리(${CATEGORY_ID})에서 discussion ${discussions.length}개 조회됨`);
  for (const d of discussions) {
    console.log(`  - #${d.number} "${d.title}" comments=${d.comments.nodes.length} reactions=${d.reactions.nodes.length}`);
  }

  const canonicalDiscussions = pickCanonicalDiscussions(discussions);
  const bySubBlog = new Map(SUB_BLOGS.map((name) => [name, []]));

  for (const discussion of canonicalDiscussions) {
    const subBlog = subBlogOf(discussion.title);
    if (!subBlog) {
      console.log(`[recent-activity] "${discussion.title}" -> 서브블로그로 분류 안 됨, 건너뜀`);
      continue;
    }

    const postUrl = `${SITE_URL}${discussion.title}`;
    const items = bySubBlog.get(subBlog);

    for (const comment of discussion.comments.nodes) {
      items.push({
        type: 'comment',
        createdAt: comment.createdAt,
        author: comment.author?.login ?? '익명',
        excerpt: truncate(comment.bodyText, 140),
        postUrl,
        url: comment.url,
      });
    }

    // 좋아요(reaction)는 댓글과 달리 특정 지점이 아니라 글 전체에 달리므로, 이동 링크는
    // 해당 Discussion(= 그 글의 댓글창) 맨 위로 보낸다.
    for (const reaction of discussion.reactions.nodes) {
      items.push({
        type: 'reaction',
        createdAt: reaction.createdAt,
        author: reaction.user?.login ?? '익명',
        content: reaction.content,
        postUrl,
        url: discussion.url,
      });
    }
  }

  await mkdir(DATA_DIR, { recursive: true });

  for (const [subBlog, items] of bySubBlog) {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const payload = {
      generatedAt: new Date().toISOString(),
      items: items.slice(0, ITEMS_PER_SUBBLOG),
    };

    const filePath = path.join(DATA_DIR, `recent-activity-${subBlog}.json`);
    const current = await readFile(filePath, 'utf8').catch(() => null);

    // items가 그대로면 generatedAt만 바뀐 의미없는 커밋이 생기므로 건너뛴다.
    // (워크플로우의 git diff가 이 파일 자체의 변경 여부로 커밋 여부를 결정한다.)
    if (current) {
      const currentItems = JSON.parse(current).items;
      if (JSON.stringify(currentItems) === JSON.stringify(payload.items)) {
        console.log(`[recent-activity] ${subBlog}: 변경 없음 (${payload.items.length}개), 건너뜀`);
        continue;
      }
    }

    console.log(`[recent-activity] ${subBlog}: ${payload.items.length}개로 갱신`);
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  }
}

main();
