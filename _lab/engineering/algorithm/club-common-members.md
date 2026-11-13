---
title: "[해시] 두 동아리의 공통 회원 찾기"
excerpt: "중복 없는 두 동아리의 회원 학번 집합이 주어질 때, 두 동아리에 모두 속한 학번을 오름차순으로 구한다."
date: 2026-11-10
tags:
  - 알고리즘
  - 해시
---

## 문제

두 동아리 A, B가 있다. 각 동아리는 회원의 학번을 가지고 있고, **같은 동아리 안에서는 학번이 중복되지 않는다.** 두 동아리에 모두 가입한 회원의 학번을 오름차순으로 구한다.

- 동아리 A의 인원 N, 동아리 B의 인원 M (1 ≤ N, M ≤ 30,000)
- 학번은 1,000,000,000 이하의 자연수. 같은 동아리 안에서는 중복되지 않지만, 두 동아리에 걸쳐서는 겹칠 수 있다
- 입력: 첫 줄에 N, 둘째 줄에 A의 학번 N개(순서 상관없음). 셋째 줄에 M, 넷째 줄에 B의 학번 M개(순서 상관없음)
- 출력: 두 동아리 모두에 속한 학번을 오름차순으로 나열

```
입력                          출력
5                             102 103 105
101 103 109 105 102
5
103 102 105 107 108
```

103, 102, 105는 A와 B 명단에 모두 있어 공통 회원이다. 109와 101은 B에 없고, 107과 108은 A에 없어 제외된다. 남은 세 학번을 오름차순으로 나열하면 `102 103 105`.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1129번 문제](https://oj.inflearn.com/problem/1129)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 공통 원소를 구하는 `commonElements` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int m = sc.nextInt();
        int[] b = new int[m];
        for (int i = 0; i < m; i++) b[i] = sc.nextInt();

        int[] answer = commonElements(a, b); // 로직은 각 시도 참고
        for (int x : answer) System.out.print(x + " ");
    }
}
```

## 시도 1 — 배열을 그대로 이중 반복

### 접근

A의 원소마다 B를 전부 훑어 같은 값이 있는지 확인했다. 겹치는 값은 `TreeSet`에 담아 오름차순으로 꺼낸다. 두 집합 모두 원소가 중복되지 않으므로, 여기서 `TreeSet`이 하는 일은 사실 중복 제거가 아니라 **정렬**뿐이다.

```java
public static int[] commonElements(int[] a, int[] b) {
    Set<Integer> answer = new TreeSet<>();
    for (int x : a) {
        for (int y : b) {
            if (x == y) {
                answer.add(x);
            }
        }
    }
    return answer.stream().mapToInt(Integer::intValue).toArray();
}
```

### 결과

**성공** — 예제에서 `102 103 105` 출력.

복잡도: 시간 O(N×M), 공간 O(K)(K는 공통 원소 수 — 결과를 담는 `TreeSet`뿐).

N, M이 각각 최대 30,000이라 N×M은 최대 9억 번. 1,000ms 제한 안에 끝난다고 보장할 수 없다 — 예제처럼 작은 입력에서는 이 문제가 드러나지 않는다.

### 분석

배열 B를 "이 값이 있는가"를 확인하는 용도로 쓰면서, 물을 때마다 B 전체를 처음부터 다시 훑었다. 그런데 "x가 B에 있는가"라는 질문 자체는 B의 순서와 아무 관계가 없다. 배열은 순서가 있는 구조라 이 질문에 답하려면 매번 끝까지 봐야 한다. 그게 N×M까지 불어난 이유다. **같은 조회가 반복된다면, 조회에 특화된 자료구조로 바꿔야 한다**는 신호다.

## 시도 2 — 해시로 조회를 O(1)에 (채택)

### 접근

A의 값을 `HashSet`에 담아 "이 값이 A에 있는가"를 확인하는 비용을 O(1)로 낮췄다. 이후 B는 한 번만 훑으며, `HashSet`에 들어있는 값만 결과에 담는다.

```java
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

public static int[] commonElements(int[] a, int[] b) {
    Set<Integer> setA = new HashSet<>();
    for (int x : a) setA.add(x);

    Set<Integer> answer = new TreeSet<>();
    for (int y : b) {
        if (setA.contains(y)) answer.add(y);
    }
    return answer.stream().mapToInt(Integer::intValue).toArray();
}
```

### 결과

**성공** — 예제에서 동일하게 `102 103 105` 출력.

복잡도: 시간 O(N+M), 공간 O(N). N, M이 각각 30,000이라도 전체 6만 번 안팎으로 끝나, 시도 1과 달리 제한 시간 안에 여유 있게 통과한다.

### 분석

시도 1과 시도 2는 "B의 원소가 A에 있는가"라는 **같은 질문**을 던진다. 차이는 그 질문을 누구에게 묻느냐다. 배열에 물으면 처음부터 끝까지 뒤져야 하니 O(N)이고, 해시 집합에 물으면 값 하나로 바로 판단되니 O(1)이다. 질문은 그대로 두고 **질문을 받는 자료구조만 바꾼 것**이 전체 복잡도를 N×M에서 N+M으로 끌어내렸다.

코딩테스트나 실무가 알고리즘적 사고를 요구하는 이유도 여기에 있다고 본다. "배열로 조회하는 코드를 처음부터 다시 발명할 수 있는가"를 묻는 게 아니라, 이미 존재하는 여러 자료구조(배열, 해시 집합, 트리셋…) 중 **지금 필요한 연산에 가장 알맞은 도구를 고르고 조합할 수 있는가**를 평가하는 것이다. 바퀴를 다시 만드는 일이 아니라, 이미 있는 바퀴 중 이 길에 맞는 바퀴를 고르는 일이다.

## 다른 방법 — 정렬 후 투 포인터

해시 집합 대신, 두 배열을 정렬해서 [두 반의 키 순서 합치기](/lab/engineering/algorithm/height-lineup-merge/)와 같은 투 포인터로 훑을 수도 있다. 두 포인터가 가리키는 값을 비교해 작은 쪽만 전진시키고, 같으면 결과에 담은 뒤 둘 다 전진시킨다.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public static int[] commonElements(int[] a, int[] b) {
    List<Integer> answer = new ArrayList<>();
    Arrays.sort(a);
    Arrays.sort(b);
    int p1 = 0, p2 = 0;
    while (p1 < a.length && p2 < b.length) {
        if (a[p1] < b[p2]) p1++;
        else if (a[p1] > b[p2]) p2++;
        else {
            answer.add(a[p1]);
            p1++;
            p2++;
        }
    }
    return answer.stream().mapToInt(Integer::intValue).toArray();
}
```

`a`, `b`를 복사하지 않고 그대로 정렬하므로, 호출한 쪽이 가지고 있던 원래 순서는 사라진다. 이 메서드를 쓰고 나서 원본 순서가 다시 필요하다면 복사본을 만들어 정렬해야 한다.

복잡도는 시간 O(N log N + M log M)(정렬이 지배), 공간 O(1)(추가 배열 없이 `a`, `b` 자체를 정렬). 해시 테이블의 버킷 오버헤드도 복사본을 위한 공간도 없지만, 정렬 비용 때문에 시도 2보다 느리고 입력 배열의 순서를 잃는다. 메모리를 아껴야 하거나, 입력이 이미 정렬돼 있거나, 원본 배열을 이후에 다시 쓸 일이 없는 상황이면 이쪽이 낫다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| 1. 이중 반복 | B를 매번 끝까지 훑어 값 확인 | O(N×M) | 정답, 큰 입력에서 시간 초과 우려 |
| **2. 해시로 조회 (채택)** | "있는가"를 `HashSet`에 물어 O(1) | O(N+M) | 정답, 제한 시간 안에 넉넉 |
| 다른 방법. 정렬 후 투 포인터 | 정렬해서 포인터 둘로 비교 | O(N log N + M log M) | 정답, 추가 공간 없지만 입력 순서 소실 |

**채택: 시도 2.** 제약(N, M ≤ 30,000)에서 이중 반복은 최악 9억 번까지 늘어나 시간 제한이 불안하지만, 해시 집합은 6만 번 안팎으로 끝나 안전하게 통과한다.

- "이 값을 본 적 있는가", "이 값이 다른 쪽에도 있는가"처럼 **조회가 반복되는 연산**은 배열보다 해시 기반 자료구조(`HashSet`, `HashMap`)가 맞는 도구인 경우가 많다.
- 알고리즘 문제를 푸는 일은 알고리즘을 처음부터 고안하는 게 아니라, 이미 있는 자료구조 중 지금 필요한 연산에 맞는 것을 고르고 조합하는 일이다. 코딩테스트와 실무가 똑같이 평가하는 지점이다.
