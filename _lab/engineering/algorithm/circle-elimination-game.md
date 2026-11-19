---
title: "[큐] 원형으로 세다 마지막에 남는 사람 정하기"
excerpt: "N명이 원형으로 둘러앉아 1부터 K까지 세며 K번째 사람이 빠지는 걸 반복할 때, 마지막까지 남는 사람의 번호를 구한다."
date: 2026-11-19 15:25:05 +0900
tags:
  - 알고리즘
  - 큐
---

## 문제

동호회 모임에 N명이 모여, 이번 주 모임 장소를 예약할 총무를 정하는 게임을 한다. 다들 원형으로 둘러앉아 1번부터 N번까지 번호를 매기고, 1번부터 시계 방향으로 돌아가며 1부터 세어 올라간다. K를 외친 사람은 게임에서 빠진다. 빠진 사람의 다음 사람부터 다시 1부터 세기 시작한다. 이렇게 한 명씩 빠지다가 마지막까지 남는 사람이 이번 주 총무를 맡는다.

{% include figure image_path="/assets/img/lab/circle-elimination-game.svg" alt="1번부터 9번까지 아홉 명이 시계 방향으로 둥글게 앉아 있다" caption="예제: 9명이 원형으로 앉은 순서(1번부터 시계 방향)" %}

- 5 ≤ N ≤ 1,000, 2 ≤ K ≤ 9
- 입력: N과 K
- 출력: 마지막까지 남는 사람의 번호

```
입력      출력
9 4       1
```

4를 외친 4번이 먼저 빠지고, 이어서 8, 3, 9, 6, 5, 7, 2번이 차례로 빠진다. 마지막까지 남는 건 1번이라, 1번이 이번 주 총무를 맡는다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1157번 문제](https://oj.inflearn.com/problem/1157)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 마지막까지 남는 번호를 구하는 `findLast` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();

        System.out.println(findLast(n, k)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 몇 번째 차례인지 직접 세기

### 접근

큐에 1번부터 N번까지 순서대로 넣는다. 맨 앞 사람을 하나씩 꺼내면서 "지금까지 몇 명째 세었는지"를 `idx`로 센다. `idx`가 K에 닿으면 그 사람은 빼고(원 밖으로) `idx`를 0으로 되돌리고, 그렇지 않으면 꺼낸 사람을 다시 맨 뒤로 보낸다(원을 한 칸 돌린 것과 같다).

```java
import java.util.LinkedList;
import java.util.Queue;

public static int findLast(int n, int k) {
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 1; i <= n; i++) queue.offer(i);

    int idx = 0;
    while (queue.size() > 1) {
        idx++;
        if (idx == k) {
            queue.poll();
            idx = 0;
        } else {
            queue.offer(queue.poll());
        }
    }
    return queue.poll();
}
```

### 결과

**성공** — 예제에서 `1` 출력.

복잡도: 시간 O(N×K), 공간 O(N).

### 분석

`idx`는 "지금 몇 번째 숫자를 세는 중인가"를 그대로 담고 있다. 매번 1씩 늘리다가 K에 닿으면 그 사람을 빼고 0으로 리셋한다 — 문제의 "1부터 세어 K를 외치면 빠진다"는 설명을 거의 그대로 코드로 옮긴 셈이다.

다만 "K번째마다 하나씩 뺀다"는 건 애초에 **K-1번 돌리고 한 번 빼는 동작의 반복**이다. `idx`라는 변수로 그 반복 횟수를 따로 세고 있는데, 정해진 횟수를 반복하는 일은 `for` 문이 이미 할 수 있는 일이다.

## 시도 2 — K-1번 돌리고 한 번 빼기 (채택)

### 접근

`idx`라는 별도 변수 없이, "맨 앞 사람을 맨 뒤로 보내는 동작"을 K-1번 반복한 뒤, 그다음 맨 앞 사람을 뺀다. 이 한 묶음이 "1부터 K까지 세어 K를 외친 사람이 빠진다"와 정확히 같다.

```java
public static int findLast(int n, int k) {
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 1; i <= n; i++) queue.offer(i);

    int answer = 0;
    while (!queue.isEmpty()) {
        for (int i = 1; i < k; i++) queue.offer(queue.poll());
        queue.poll();
        if (queue.size() == 1) answer = queue.poll();
    }
    return answer;
}
```

### 결과

**성공** — 예제에서 동일하게 `1` 출력.

복잡도: 시간 O(N×K), 공간 O(N). 시도 1과 같다 — 세는 방식만 바뀌었을 뿐, 큐를 돌리고 빼는 총 횟수는 그대로다.

### 분석

시도 1의 `idx`는 "1부터 K까지 세는 과정"을 흉내 내려고 바깥에 따로 둔 카운터다. 그런데 "K-1번 돌리고 한 번 뺀다"는 반복 횟수가 **이미 정해져 있는 일**이라, `for (int i = 1; i < k; i++)`처럼 반복문 자체에 그 횟수를 맡기면 `idx`도, "K에 닿으면 리셋"하는 분기도 전부 필요 없어진다. 한 사람이 빠질 때마다 큐 크기가 1이 됐는지 확인해서, 마지막 한 명이 남는 순간 그 번호를 들고 나온다.

## 다른 방법 — 배열(리스트)에서 인덱스를 직접 계산

큐 대신, 리스트에 1부터 N까지 넣어두고 "다음에 빠질 사람의 위치"를 나머지 연산으로 직접 계산할 수도 있다. 위치를 K-1만큼 옮기되, 리스트 크기로 나눈 나머지를 취하면 원형으로 도는 효과를 낸다.

```java
import java.util.ArrayList;
import java.util.List;

public static int findLast(int n, int k) {
    List<Integer> people = new ArrayList<>();
    for (int i = 1; i <= n; i++) people.add(i);

    int idx = 0;
    while (people.size() > 1) {
        idx = (idx + k - 1) % people.size();
        people.remove(idx);
    }
    return people.get(0);
}
```

복잡도는 시간 O(N²)(최악, `remove`가 그 뒤 원소를 전부 한 칸씩 당겨야 한다), 공간 O(N). 큐를 돌리는 시도 2보다 차수가 높지만, "다음 위치 = (지금 위치 + K − 1) % 남은 인원"이라는 식 하나로 다음에 빠질 사람을 바로 가리킬 수 있어, 회전이라는 중간 단계 없이 더 직접적으로 읽힌다.

이 문제 크기(N ≤ 1,000)에서는 O(N²)도 충분히 빠르지만, N이 훨씬 커진다면 매번 원소를 당겨야 하는 이 방법보다 큐 쪽이 유리하다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| 1. 직접 세기 | `idx`로 1~K를 직접 셈 | O(N×K) | 정답, 카운터 변수가 따로 필요 |
| **2. K-1번 돌리고 빼기 (채택)** | 반복 횟수를 `for` 문에 맡김 | O(N×K) | 정답, 더 짧음 |
| 다른 방법. 인덱스 직접 계산 | 나머지 연산으로 다음 위치 계산 | O(N²) | 정답, N이 커지면 불리 |

**채택: 시도 2.** 시도 1과 복잡도는 같지만, 셀 횟수를 반복문에 맡겨 별도 카운터와 리셋 분기가 사라져 더 단순하다.

- 반복 횟수가 이미 정해져 있다면, 그 횟수를 세는 변수를 따로 두지 말고 `for` 문의 반복 횟수 자체로 표현한다.
- 원형으로 도는 구조는 "맨 앞을 맨 뒤로 보내는" 큐 회전으로 표현할 수도 있고, "나머지 연산으로 다음 위치를 계산"하는 인덱스로 표현할 수도 있다. 전자는 각 연산이 O(1)이라 구조가 커져도 안전하고, 후자는 식 하나로 더 직접적으로 읽힌다.
