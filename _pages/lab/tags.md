---
title: "Lab Tags"
layout: archive
permalink: /lab/tags/
author_profile: false
sidebar:
  nav: "lab"
---

{% assign docs = site.lab %}
{% assign all_tags = docs | map: "tags" | join: "," | split: "," | uniq | sort_natural %}

{%- comment -%}
  .page__content 래퍼: 테마 번들 JS가 document.querySelector(".page__content")를
  null 체크 없이 쓰는데, archive 레이아웃은 원래 이 클래스가 없어서 콘솔 에러가 난다.

  태그 글(섹션)을 전체 태그 목록보다 먼저 둔다 — 글에서 태그를 눌러 들어오면
  #태그 앵커로 바로 스크롤되긴 하지만, 그 전에 전체 태그 목록을 먼저 지나치지 않고
  클릭한 태그의 글이 흐름상 먼저 나오도록.
{%- endcomment -%}
<div class="page__content">
{% for tag in all_tags %}{% if tag != "" %}
  {% assign tagged = docs | where_exp: "doc", "doc.tags contains tag" | sort: "date" | reverse %}
  <section id="{{ tag | slugify }}" class="taxonomy__section">
    <h2 class="archive__subtitle">{{ tag }}</h2>
    <div class="entries-list">
      {% for post in tagged %}{% include archive-single.html %}{% endfor %}
    </div>
    <a href="#page-title" class="back-to-top">{{ site.data.ui-text[site.locale].back_to_top | default: 'Back to Top' }} &uarr;</a>
  </section>
{% endif %}{% endfor %}

<ul class="taxonomy__index">
  {% for tag in all_tags %}{% if tag != "" %}
    {% assign tagged = docs | where_exp: "doc", "doc.tags contains tag" %}
    <li><a href="#{{ tag | slugify }}"><strong>{{ tag }}</strong> <span class="taxonomy__count">{{ tagged.size }}</span></a></li>
  {% endif %}{% endfor %}
</ul>
</div>
