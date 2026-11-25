---
title: "[해시] 추첨 번호 중복 확인하기"
excerpt: "참가자들이 고른 추첨 번호 목록에서, 서로 겹치는 번호가 있는지 확인한다."
date: 2026-11-23 15:46:47 +0900
tags:
  - 알고리즘
  - 해시
---

## 문제

추첨 이벤트에 참가한 사람 N명이 각자 1 이상 10,000,000 이하의 자연수 중 하나를 골라 응모한다. 참가자들이 고른 번호 중 겹치는 게 있으면 `D`(duplication)를, 모두 서로 다른 번호를 골랐다면 `U`(unique)를 출력한다.

- 참가자 수 N(5 ≤ N ≤ 100,000)
- 입력: 첫 줄에 N, 둘째 줄에 참가자들이 고른 순서대로 N개의 번호
- 출력: 중복이 있으면 `D`, 없으면 `U`

```
입력
7
120 48 999 300 77 48 5

출력
D
```

48을 고른 사람이 두 명(두 번째, 여섯 번째) 있어 번호가 겹치므로 `D`가 출력된다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1169번 문제](https://oj.inflearn.com/problem/1169)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 중복을 확인하는 `checkDuplicate` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] numbers = new int[n];
        for (int i = 0; i < n; i++) numbers[i] = sc.nextInt();

        System.out.println(checkDuplicate(numbers)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 집합에 모아 크기 비교하기 (성공, 채택)

### 접근

번호를 하나씩 집합(Set)에 넣는다. 집합은 같은 값을 두 번 넣어도 하나로만 센다는 성질이 있으므로, 넣은 개수(N)와 집합에 실제로 남은 개수(`set.size()`)가 다르면 어딘가 겹치는 번호가 있었다는 뜻이다.

```java
import java.util.HashSet;
import java.util.Set;

public static String checkDuplicate(int[] numbers) {
    Set<Integer> set = new HashSet<>();
    for (int number : numbers) {
        set.add(number);
    }
    return set.size() == numbers.length ? "U" : "D";
}
```

### 결과

**성공** — 예제에서 `D` 출력.

복잡도: 시간 O(N)(평균, 해시 집합에 넣는 데 상수 시간), 공간 O(N)(집합이 번호를 따로 보관한다).

### 분석

집합에 이미 들어있는 값을 또 넣어도 집합의 크기는 늘지 않는다는 성질 하나로 중복 여부를 판단한다. 몇 번 겹쳤는지, 어떤 번호가 겹쳤는지는 알 수 없지만, 이 문제는 "겹치는 게 있는지 없는지"만 물어보므로 그걸로 충분하다.

## 다른 방법 — 정렬해서 바로 옆끼리 비교하기

번호를 오름차순으로 정렬하면, 같은 번호는 반드시 서로 붙어 있게 된다. 그러면 바로 옆(`i`, `i+1`)끼리만 비교해도 중복을 찾을 수 있다.

```java
import java.util.Arrays;

public static String checkDuplicate(int[] numbers) {
    Arrays.sort(numbers);
    for (int i = 0; i < numbers.length - 1; i++) {
        if (numbers[i] == numbers[i + 1]) {
            return "D";
        }
    }
    return "U";
}
```

복잡도는 시간 O(N log N)(정렬이 가장 오래 걸린다), 공간 O(1)(추가로 번호를 따로 보관하지 않고, 입력 배열 안에서 정렬만 한다). 집합 방식보다 시간은 더 걸리지만 별도의 집합을 만들지 않는다 — 대신 `Arrays.sort`가 입력 배열의 순서를 그 자리에서 바꿔버리므로, 원래 순서가 이후에도 필요하다면 미리 복사해 둬야 한다.

입력 배열을 그대로 보존할 필요가 없고 추가 메모리를 아끼고 싶다면 이 방법이 낫고, 그렇지 않다면 집합 방식이 더 간단하고 빠르다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 집합에 모아 크기 비교 (채택)** | 집합은 중복을 자동으로 하나로 센다 | 시간 O(N), 공간 O(N) | 정답 |
| 다른 방법. 정렬 후 인접 비교 | 같은 값은 정렬하면 반드시 붙는다 | 시간 O(N log N), 공간 O(1) | 정답, 입력 배열 순서가 바뀜 |

**채택: 시도 1.** 코드가 가장 단순하고(넣고 크기만 비교), N이 최대 10만이라 집합을 따로 만드는 비용도 충분히 감당할 수 있다.

- "겹치는 게 있는지"만 물어보는 문제는, 어떤 값이 겹쳤는지까지 알 필요가 없다 — 집합의 크기 변화만 봐도 충분하다.
- 정렬은 중복을 "서로 붙여놓는" 효과가 있어서, 그 뒤엔 인접한 것끼리만 비교해도 된다. 다만 입력 배열 자체의 순서를 바꾼다는 부작용을 기억해야 한다.
