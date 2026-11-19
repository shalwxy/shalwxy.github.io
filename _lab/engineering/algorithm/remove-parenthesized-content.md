---
title: "[스택] 괄호로 감싼 내용 지우기"
excerpt: "문자열에서 괄호로 감싸진 부분을 통째로 지우고, 남는 글자만 이어 붙인다."
date: 2026-11-18 14:00:00 +0900
tags:
  - 알고리즘
  - 스택
---

## 문제

소스 코드에 괄호로 감싼 임시 메모가 섞여 있다. 괄호와 그 안의 내용을 통째로 지우고, 남는 글자만 순서대로 이어 붙인다. 괄호는 항상 짝이 맞게 들어온다.

- 문자열의 길이는 100을 넘지 않는다
- 입력: 괄호가 포함된 문자열 한 줄
- 출력: 괄호와 그 안의 내용을 지우고 남은 글자

```
입력                                       출력
AB(CD(EF)GH)IJ(K)(LM(N)O)PQ                ABIJPQ
```

괄호로 감싼 부분은 중첩되어 있어도 통째로 사라진다. `(CD(EF)GH)`는 안에 `(EF)`가 한 번 더 들어있지만, 가장 바깥 괄호가 닫히는 순간 그 안의 모든 내용(`CD(EF)GH` 전부)이 함께 지워진다. 그렇게 지워지고 남는 글자는 `A`, `B`, `I`, `J`, `P`, `Q`뿐이라 `ABIJPQ`.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1153번 문제](https://oj.inflearn.com/problem/1153)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 괄호 안의 내용을 지우는 `removeParenthesized` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();

        System.out.println(removeParenthesized(s)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 스택에 쌓고, 닫히면 괄호까지 모두 꺼내 버리기 (채택)

### 접근

[올바른 괄호 판별하기](/lab/engineering/algorithm/valid-parentheses/)와 같은 스택을 쓰지만, 이번엔 "짝이 맞는지"가 아니라 "괄호 안의 내용을 지운다"가 목적이다. 괄호가 아닌 글자는 일단 스택에 쌓아둔다. `)`를 만나면, 그 안에 쌓여 있던 글자들을 `'('`가 나올 때까지 전부 꺼내서 버린다 — 꺼내는 족족 버리는 거라 결과에 남지 않는다.

```java
import java.util.Stack;
import java.util.stream.Collectors;

public static String removeParenthesized(String s) {
    Stack<Character> stack = new Stack<>();
    for (char x : s.toCharArray()) {
        if (x != ')') {
            stack.push(x);
        } else {
            while (stack.pop() != '(') {
                // 괄호 안의 글자를 꺼내서 버린다
            }
        }
    }
    return stack.stream()
            .map(String::valueOf)
            .collect(Collectors.joining());
}
```

### 결과

**성공** — 예제에서 `ABIJPQ` 출력.

복잡도: 시간 O(L), 공간 O(L). L은 문자열 길이.

### 분석

스택에 쌓인 `'('`가 "지금 이 지점부터 지워야 할 구간이 시작됐다"는 표시 역할을 한다. `)`를 만나면 그 표시가 나올 때까지 꺼내서 버리는 것으로, **가장 최근에 열린 괄호부터 처리된다(LIFO)**는 성질을 그대로 쓴다. 중첩된 괄호(`(CD(EF)GH)`처럼)도 안쪽 `)`가 먼저 안쪽 내용만 지우고, 바깥쪽 `)`가 마지막에 남은 걸(바깥 괄호의 여는 지점까지) 통째로 지운다 — 두 번 지워지는 게 아니라, 안쪽을 지우고 남은 잔해까지 바깥이 이어서 지우는 것뿐이다.

## 다른 방법 — 깊이만 세고, 0일 때만 쌓기

[올바른 괄호 판별하기](/lab/engineering/algorithm/valid-parentheses/)의 "다른 방법"처럼, 여기서도 스택이 꼭 있어야 하는 건 아니다. 지금 **몇 겹의 괄호 안에 있는지**(깊이)만 정수로 세고, 괄호가 아닌 글자는 **깊이가 0일 때만** 결과에 이어 붙이면 된다.

```java
public static String removeParenthesized(String s) {
    StringBuilder sb = new StringBuilder();
    int depth = 0;
    for (char x : s.toCharArray()) {
        if (x == '(') {
            depth++;
        } else if (x == ')') {
            depth--;
        } else if (depth == 0) {
            sb.append(x);
        }
    }
    return sb.toString();
}
```

시도 1은 "일단 쌓아두고, 나중에 괄호 안이었다는 게 확정되면 꺼내서 버린다"는 방식이라 글자를 한 번 쌓았다가 다시 꺼내는 수고가 든다. 이 방법은 "지금 당장 괄호 밖인지"를 그 자리에서 바로 알 수 있으니, 괄호 밖의 글자만 곧바로 결과에 적고 안쪽 글자는 **애초에 담지도 않는다.** 복잡도는 시간 O(L)로 같지만 공간은 O(1)(결과 문자열 제외)로 줄어든다.

다만 이 방법도 "이 글자가 지금 지워지는 중인지"만 알면 되고, 지워지는 글자가 무엇이었는지는 기억할 필요가 없는 문제라서 성립한다. 지워진 구간의 내용을 나중에 다시 써야 하는 문제라면, 그 내용을 들고 있을 스택이 다시 필요해진다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 스택에 쌓고 통째로 꺼내 버리기 (채택)** | `(`가 나올 때까지 꺼내서 버림 | 시간 O(L), 공간 O(L) | 정답 |
| 다른 방법. 깊이만 세기 | 깊이 0일 때만 결과에 담음 | 시간 O(L), 공간 O(1) | 정답, 지워진 내용은 기억 못 함 |

**채택: 시도 1.** [올바른 괄호 판별하기](/lab/engineering/algorithm/valid-parentheses/)와 같은 스택 구조를 그대로 재사용할 수 있고, 지워야 할 구간을 "쌓았다가 꺼내 버린다"는 동작이 직접적으로 드러난다.

- 중첩된 구조를 지우거나 묶어낼 때, 가장 안쪽부터 처리되는 성질(LIFO)이 필요하면 스택이 자연스럽다.
- "지금 조건에 해당하는 중인지"만 알면 되고 그 안의 내용을 따로 쓸 일이 없다면, 스택 대신 깊이(정수)만 세는 것으로 충분할 때가 많다.
