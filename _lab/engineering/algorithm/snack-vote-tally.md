---
title: "[해시] 투표로 뽑힌 간식 찾기"
excerpt: "다섯 가지 기호(A~E) 중 하나를 고른 투표 결과가 순서대로 주어질 때, 가장 많은 표를 받은 기호를 구한다."
date: 2026-11-16
tags:
  - 알고리즘
  - 해시
---

## 문제

학생들이 좋아하는 간식을 투표로 정한다. 간식은 기호 A, B, C, D, E 다섯 가지가 등록되어 있다. 선생님이 학생들이 고른 기호를 발표한 순서대로 하나의 문자열로 나열하면, 가장 많이 나온 기호를 구한다. 반드시 하나의 기호만 가장 많이 나오도록 결과가 주어진다고 가정한다.

- 5 ≤ N ≤ 50 (학생 수)
- 입력: 첫 줄에 N. 둘째 줄에 길이 N인 문자열(A~E로만 구성)
- 출력: 가장 많이 나온 기호

```
입력                          출력
13                            C
CBCABCDCBCEAD
```

C가 1, 3, 6, 8, 10번째 글자로 다섯 번 나와 가장 많다. B는 세 번, A와 D는 두 번씩, E는 한 번 나와 합이 13이다. 가장 많이 나온 C가 답.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1139번 문제](https://oj.inflearn.com/problem/1139)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 가장 많이 나온 기호를 찾는 `findWinner` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String s = sc.next();

        System.out.println(findWinner(s)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 알파벳을 배열 인덱스로 (채택)

### 접근

후보가 'A'부터 'E'까지, 정확히 5개라는 걸 알고 있으니 문자를 바로 배열 인덱스로 쓴다. 문자 `x`의 순서는 `x - 'A'`로 구해지므로(`'A'-'A'=0`, `'B'-'A'=1`, …), 크기 5인 배열에 득표수를 센다.

```java
public static String findWinner(String s) {
    int[] cnt = new int[5];
    for (char x : s.toCharArray()) {
        cnt[x - 'A']++;
    }

    int max = 0, maxIdx = 0;
    for (int i = 0; i < cnt.length; i++) {
        if (cnt[i] > max) {
            max = cnt[i];
            maxIdx = i;
        }
    }
    return String.valueOf((char) (maxIdx + 'A'));
}
```

### 결과

**성공** — 예제에서 `C` 출력.

복잡도: 시간 O(N), 공간 O(1)(후보 수가 5로 고정이라 배열 크기도 고정). 문자열을 한 번 훑어 세고, 크기 5인 배열을 한 번 더 훑어 최댓값을 찾는다.

### 분석

`x - 'A'`는 "A부터 E까지, 알파벳 순서로 연속된 5개"라는 이 문제만의 사실에 기대고 있다. 이 전제가 성립하는 한 가장 단순하고 빠른 방법이지만, 후보가 F까지 늘어나거나 숫자 기호로 바뀌면 인덱스 계산 자체를 다시 설계해야 한다. 이 전제 없이도 동작하는 방법은 "다른 방법"에서 다룬다.

## 다른 방법 — 해시맵으로 기호를 그대로 키로 쓰기

후보가 몇 개인지, 어떤 문자인지 몰라도 되는 방법도 있다. 문자를 배열 인덱스로 바꾸는 대신, 문자 자체를 해시맵의 키로 써서 득표수를 센다.

```java
import java.util.HashMap;
import java.util.Map;

public static String findWinner(String s) {
    Map<Character, Integer> cnt = new HashMap<>();
    for (char x : s.toCharArray()) {
        cnt.put(x, cnt.getOrDefault(x, 0) + 1);
    }

    int max = 0;
    char answer = ' ';
    for (char key : cnt.keySet()) {
        if (cnt.get(key) > max) {
            max = cnt.get(key);
            answer = key;
        }
    }
    return String.valueOf(answer);
}
```

복잡도: 시간 O(N), 공간 O(후보 수). 차수는 시도 1과 같지만, 해시 연산과 `Integer` 오토박싱이 끼어들어 실제로는 배열 접근보다 약간 더 든다.

후보가 A~E로 고정이라는 이 문제의 전제가 없어도 그대로 동작한다는 게 장점이다. 후보 기호가 알파벳이 아니거나, 연속돼 있지 않거나, 몇 개인지 미리 알 수 없을 때는 배열 인덱스를 설계할 수 없으니 이쪽을 고른다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 알파벳을 배열 인덱스로 (채택)** | `x - 'A'`로 바로 접근 | O(N) | 정답, 후보가 A~E 고정이라는 전제에 의존 |
| 다른 방법. 해시맵 | 문자를 키로 그대로 사용 | O(N) | 정답, 후보 집합을 몰라도 동작 |

**채택: 시도 1.** 이 문제는 후보가 정확히 A~E 다섯 개로 고정돼 있다고 못박고 있어서, 그 사실을 그대로 활용하는 배열 인덱싱이 해시맵보다 더 단순하고 빠르다.

- 키가 될 값의 범위가 **작고 고정돼 있다는 걸 미리 안다면**, 그 값을 배열 인덱스로 바로 쓰는 쪽이 해시맵보다 단순하고 빠르다.
- 반대로 키의 종류나 개수를 **모르거나 범위가 연속적이지 않다면** 해시맵처럼 "키를 그대로 쓰는" 자료구조가 필요하다. 이번 문제처럼 범위가 뻔한데 해시맵을 쓰면, 문제가 이미 알려준 정보를 활용하지 않은 채 더 일반적이고 더 비싼 도구를 꺼내는 셈이다.
