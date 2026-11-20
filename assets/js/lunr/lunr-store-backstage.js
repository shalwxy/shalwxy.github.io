---
layout: none
---

{%- comment -%}
  lunr-store-lab.js 등을 그대로 복사한 서브 블로그 전용 검색 인덱스.
  단, 여기서는 doc.search != false 필터를 일부러 안 건다 — backstage 컬렉션은
  defaults(_config.yml)에서 전체 글에 search: false를 깔아둬서 "전역 통합 인덱스"
  (lunr-store.js)에서는 빠지게 해뒀는데, 그 플래그를 여기서도 그대로 적용하면
  backstage 자신의 검색마저 전부 걸러져서 빈 인덱스가 된다. backstage 안에서는
  항상 전체 글이 검색되어야 하므로 site.backstage를 필터 없이 그대로 쓴다.
{%- endcomment -%}
var store = [
  {%- assign docs = site.backstage -%}
  {%- for doc in docs -%}
    {%- if doc.header.teaser -%}
      {%- capture teaser -%}{{ doc.header.teaser }}{%- endcapture -%}
    {%- else -%}
      {%- assign teaser = site.teaser -%}
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
      "categories": {{ doc.categories | jsonify }},
      "tags": {{ doc.tags | jsonify }},
      "url": {{ doc.url | relative_url | jsonify }},
      "teaser": {{ teaser | relative_url | jsonify }}
    }{%- unless forloop.last -%},{%- endunless -%}
  {%- endfor -%}
]
