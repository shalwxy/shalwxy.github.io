---
title: "[스택] 후위 표기법 수식 계산하기"
excerpt: "후위 표기법(postfix)으로 적힌 수식이 주어질 때, 그 값을 계산한다."
date: 2026-11-19 12:30:00 +0900
tags:
  - 알고리즘
  - 스택
---

## 문제

후위 표기법(postfix)으로 적힌 수식이 주어질 때, 그 값을 계산한다. 사람이 보통 쓰는 중위 표기법과 달리, 후위 표기법은 연산자를 두 피연산자 뒤에 적어서 괄호나 우선순위 규칙 없이도 계산 순서가 분명하다.

- 수식의 길이는 50을 넘지 않는다
- 피연산자는 1~9 사이의 한 자리 숫자, 연산자는 `+`, `-`, `*`, `/` 중 하나
- 입력: 후위 표기법으로 적힌 수식 한 줄
- 출력: 계산 결과

```
입력                출력
83-4*6+             26
```

`83-4*6+`는 중위 표기법으로 `(8-3)*4+6`과 같다. 8에서 3을 빼면 5, 5에 4를 곱하면 20, 거기에 6을 더하면 26이다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1155번 문제](https://oj.inflearn.com/problem/1155)를 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 수식을 계산하는 `evaluatePostfix` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();

        System.out.println(evaluatePostfix(s)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 숫자는 쌓고, 연산자를 만나면 둘을 꺼내 계산 (채택)

### 접근

왼쪽에서부터 한 글자씩 본다. 숫자면 스택에 쌓아두고, 연산자를 만나면 스택에서 **두 번** 꺼내 계산한 뒤 결과를 다시 쌓는다. 먼저 꺼낸 값이 오른쪽 피연산자(`rt`), 그다음 꺼낸 값이 왼쪽 피연산자(`lt`)다 — 스택이라 나중에 들어간 값이 먼저 나오기 때문이다.

```java
import java.util.Stack;

public static int evaluatePostfix(String s) {
    Stack<Integer> stack = new Stack<>();
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            stack.push(c - '0');
        } else {
            int rt = stack.pop();
            int lt = stack.pop();
            if (c == '+') stack.push(lt + rt);
            else if (c == '-') stack.push(lt - rt);
            else if (c == '*') stack.push(lt * rt);
            else stack.push(lt / rt);
        }
    }
    return stack.pop();
}
```

### 결과

**성공** — 예제에서 `26` 출력.

복잡도: 시간 O(L), 공간 O(L). L은 수식의 길이.

### 분석

숫자 두 개가 쌓인 순서를 생각해보면 `rt`, `lt`를 왜 이 순서로 불러야 하는지 보인다. `83-`를 보면 8을 먼저 쌓고 3을 나중에 쌓았으니, 스택에서 먼저 나오는 건 나중에 쌓인 3(오른쪽 피연산자)이고, 그다음 나오는 게 8(왼쪽 피연산자)이다. `+`나 `*`처럼 순서를 바꿔도 결과가 같은 연산이면 상관없지만, `-`와 `/`는 순서가 바뀌면 답이 완전히 달라진다(`lt - rt`와 `rt - lt`는 부호가 반대다). 두 번 꺼낸 값을 **항상 같은 이름(`lt`, `rt`)**으로 고정해두면, 네 연산자 모두 같은 규칙(`lt 연산자 rt`)으로 적을 수 있어 헷갈릴 일이 없다.

## 다른 방법 — 스택 대신 배열과 인덱스로

수식의 길이가 최대 50으로 정해져 있으니, 스택에 쌓이는 숫자의 개수도 그 범위를 넘지 않는다. `Stack<Integer>` 대신 크기를 미리 잡은 `int[]` 배열과 "지금 맨 위가 몇 번째 칸인지" 가리키는 인덱스로 같은 동작을 할 수 있다.

```java
public static int evaluatePostfix(String s) {
    int[] stack = new int[s.length()];
    int top = -1;
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            stack[++top] = c - '0';
        } else {
            int rt = stack[top--];
            int lt = stack[top--];
            if (c == '+') stack[++top] = lt + rt;
            else if (c == '-') stack[++top] = lt - rt;
            else if (c == '*') stack[++top] = lt * rt;
            else stack[++top] = lt / rt;
        }
    }
    return stack[top];
}
```

복잡도는 시간 O(L)로 같지만, 공간은 기본형 `int` 배열이라 박싱이 없고 `Stack`의 내부 동기화 비용도 없다. 다만 "수식 길이가 스택 크기의 상한"이라는 사실에 기대고 있어서, 입력 길이를 미리 알 수 없는 상황이라면 이 방법을 쓸 수 없다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 스택으로 피연산자 두 개씩 계산 (채택)** | `rt`, `lt` 순서 고정 | 시간 O(L), 공간 O(L) | 정답 |
| 다른 방법. 배열 + 인덱스 | 크기를 미리 알고 배열로 대체 | 시간 O(L), 공간 O(L) | 정답, 박싱과 동기화 비용 없음 |

**채택: 시도 1.** `Stack`이 이름 그대로 의도를 드러내 읽기 쉽고, 수식 길이가 50 이하인 이 문제 크기에서는 배열로 바꿔서 얻는 이득이 체감되지 않는다.

- 뺄셈이나 나눗셈처럼 **순서가 중요한 연산**에서 스택을 두 번 꺼낼 때는, 먼저 나온 값과 나중에 나온 값 중 어느 쪽이 어느 피연산자인지 이름을 고정해 둬야 헷갈리지 않는다. 스택은 나중에 넣은 게 먼저 나온다는 것만 기억하면 된다.
- 후위 표기법은 괄호나 연산자 우선순위 없이도, **숫자는 쌓고 연산자는 바로 앞 두 개를 소비한다**는 규칙 하나로 계산된다 — 이 단순함이 스택과 바로 맞아떨어지는 이유다.
