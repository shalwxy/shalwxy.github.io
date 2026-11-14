---
layout: none
---

{%- comment -%}
  remote_theme(mmistakes/minimal-mistakes@4.26.2)의 assets/js/lunr/lunr-store.js를 오버라이드한
  파일. 이건 루트/404처럼 특정 서브 블로그에 속하지 않는 페이지를 위한 "전체 통합" 검색
  인덱스로만 쓰인다(lab/essay/playground 안에서는 lunr-store-lab.js 등 서브 블로그 전용
  인덱스를 쓴다 - search/lunr-search-scripts.html 참고).

  원본은 excerpt를 doc.content 전체를 strip_html + truncatewords: 50으로 매번 다시 처리해서
  만드는데, 이 블로그의 모든 글은 front matter에 excerpt를 이미 써두기 때문에(예: _lab/**/*.md)
  굳이 본문 전체를 다시 훑을 필요가 없다. doc.excerpt를 그대로 쓰면 저자가 직접 쓴 요약이라
  품질도 더 낫고, 빌드할 때마다 lab/essay/playground 글 전체 본문을 두 번(전체 통합 인덱스+
  서브 블로그별 인덱스) 처리하던 것도 줄어든다.
{%- endcomment -%}
var store = [
  {%- for c in site.collections -%}
    {%- if forloop.last -%}
      {%- assign l = true -%}
    {%- endif -%}
    {%- assign docs = c.docs | where_exp:'doc','doc.search != false' -%}
    {%- for doc in docs -%}
      {%- if doc.header.teaser -%}
        {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
      {%- else -%}
        {%- assign teaser = site.teaser -%}
      {%- endif -%}
      {
        "title": {{ doc.title | jsonify }},
        "excerpt": {{ doc.excerpt | strip_html | strip_newlines | jsonify }},
        "categories": {{ doc.categories | jsonify }},
        "tags": {{ doc.tags | jsonify }},
        "url": {{ doc.url | relative_url | jsonify }},
        "teaser": {{ teaser | relative_url | jsonify }}
      }{%- unless forloop.last and l -%},{%- endunless -%}
    {%- endfor -%}
  {%- endfor -%}{%- if site.lunr.search_within_pages -%},
  {%- assign pages = site.pages | where_exp: 'doc', 'doc.search != false' | where_exp: 'doc', 'doc.title != null' -%}
  {%- for doc in pages -%}
    {%- if forloop.last -%}
      {%- assign l = true -%}
    {%- endif -%}
  {
    "title": {{ doc.title | jsonify }},
    "excerpt":
        {%- if site.search_full_content == true -%}
          {{ doc.content | newline_to_br |
            replace:"<br />", " " |
            replace:"</p>", " " |
            replace:"</h1>", " " |
            replace:"</h2>", " " |
            replace:"</h3>", " " |
            replace:"</h4>", " " |
            replace:"</h5>", " " |
            replace:"</h6>", " "|
          strip_html | strip_newlines | jsonify }},
        {%- else -%}
          {{ doc.content | newline_to_br |
            replace:"<br />", " " |
            replace:"</p>", " " |
            replace:"</h1>", " " |
            replace:"</h2>", " " |
            replace:"</h3>", " " |
            replace:"</h4>", " " |
            replace:"</h5>", " " |
            replace:"</h6>", " "|
          strip_html | strip_newlines | truncatewords: 50 | jsonify }},
        {%- endif -%}
    "url": {{ doc.url | absolute_url | jsonify }}
  }{%- unless forloop.last and l -%},{%- endunless -%}
  {%- endfor -%}
{%- endif -%}]
