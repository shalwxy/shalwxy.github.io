---
title: "[정렬] 콘서트 좌석 정렬하기"
excerpt: "좌석 정보(구역 번호, 좌석 번호)를 구역 먼저, 같은 구역이면 좌석 번호 순으로 정렬할 때, 데이터가 많아지면 정렬 알고리즘의 복잡도가 왜 중요해지는지 살펴본다."
date: 2026-11-24 15:26:00 +0900
tags:
  - 알고리즘
  - 정렬
---

## 문제

콘서트장 좌석은 구역 번호와 그 구역 안에서의 좌석 번호로 구분된다. 입장 안내판에는 예매된 좌석을 구역 번호 순으로, 같은 구역이면 좌석 번호 순으로 정렬해 표시한다.

- 예매된 좌석 수 N(3 ≤ N ≤ 100,000)
- 구역 번호와 좌석 번호는 모두 양의 정수
- 입력: 첫 줄에 N, 둘째 줄부터 N개의 줄에 걸쳐 구역 번호와 좌석 번호
- 출력: 정렬된 좌석 정보를 한 줄에 하나씩

```
입력
5
3 15
1 8
1 4
3 9
5 13

출력
1 4
1 8
3 9
3 15
5 13
```

구역 1에 좌석이 둘(8, 4) 있어 좌석 번호가 작은 4가 먼저 오고, 구역 3에도 둘(15, 9)이 있어 9가 15보다 먼저 온다. 구역 번호 자체는 1, 3, 5 순으로 오름차순이다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1176번 문제](https://oj.inflearn.com/problem/1176)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 정렬하는 `sortSeats` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] seats = new int[n][2];
        for (int i = 0; i < n; i++) {
            seats[i][0] = sc.nextInt();
            seats[i][1] = sc.nextInt();
        }

        int[][] sorted = sortSeats(seats); // 로직은 각 시도 참고

        StringBuilder sb = new StringBuilder();
        for (int[] seat : sorted) sb.append(seat[0]).append(' ').append(seat[1]).append('\n');
        System.out.print(sb);
    }
}
```

## 시도 1 — 선택 정렬 방식 (성공이지만 비효율)

### 접근

아직 정리되지 않은 구간에서 "구역 번호가 더 작은, 같으면 좌석 번호가 더 작은" 좌석을 찾아, 그 구간의 맨 앞과 자리를 바꾼다.

```java
public static int[][] sortSeats(int[][] seats) {
    for (int i = 0; i < seats.length; i++) {
        int minIdx = i;
        for (int j = i + 1; j < seats.length; j++) {
            if (seats[j][0] < seats[minIdx][0] ||
                    (seats[j][0] == seats[minIdx][0] && seats[j][1] < seats[minIdx][1])) {
                minIdx = j;
            }
        }
        swap(seats, i, minIdx);
    }
    return seats;
}

public static void swap(int[][] seats, int i, int j) {
    int[] tmp = seats[i];
    seats[i] = seats[j];
    seats[j] = tmp;
}
```

### 결과

**성공** — 예제에서 정답과 같은 순서로 출력된다.

다만 이 문제는 N이 최대 100,000까지 주어질 수 있다. 실제로 좌석 1만 개를 정렬시켜 보면 90ms 가까이 걸리는데, N이 10배(10만)로 늘면 비교 횟수는 100배로 늘어나므로 10초 가까이 걸릴 수 있다는 뜻이고, 이 문제의 제한 시간 1초를 가볍게 넘긴다.

### 분석

선택 정렬은 매 바퀴(`i`)마다 구간 전체에서 최솟값을 찾아 그 자리에 확정한다. 몇 바퀴를 돌든 안쪽 반복문이 구간 전체를 끝까지 훑어야 하므로, 비교 횟수가 항상 N²에 비례한다. N이 100 정도면 문제가 안 되지만, 10만이면 통과할 수 없다.

## 시도 2 — 버블 정렬 방식 (성공이지만 비효율)

### 접근

인접한 두 좌석을 비교해, 뒤쪽이 더 "작으면"(구역 번호가 작거나, 같으면 좌석 번호가 작으면) 자리를 바꾼다.

```java
public static int[][] sortSeats(int[][] seats) {
    for (int i = 0; i < seats.length - 1; i++) {
        for (int j = seats.length - 1; j > i; j--) {
            if (seats[j][0] < seats[j - 1][0] ||
                    (seats[j][0] == seats[j - 1][0] && seats[j][1] < seats[j - 1][1])) {
                swap(seats, j, j - 1);
            }
        }
    }
    return seats;
}
```

`swap` 메서드는 시도 1과 같다.

### 결과

**성공** — 예제에서 정답과 같은 순서로 출력된다.

다만 이 문제는 N이 최대 100,000까지 주어질 수 있다. 이 코드는 비교를 N²에 가깝게 하는데, 실제로 좌석 1만 개를 정렬시켜 보면 100ms가 넘게 걸린다. N이 10배(10만)로 늘면 비교 횟수는 100배로 늘어나므로 10초 넘게 걸릴 수 있다는 뜻이고, 이 문제의 제한 시간 1초를 가볍게 넘긴다.

### 분석

정렬 자체는 맞게 한다. 문제는 **이 문제의 제약에서** 비교 횟수가 너무 많다는 것이다 — 좌석이 몇 개가 되든 안쪽 반복문이 구간 전체를 끝까지 훑기 때문에, 비교 횟수가 항상 N²에 비례한다. N이 100 정도면 문제가 안 되지만, 10만이면 통과할 수 없다.

## 시도 3 — 삽입 정렬 방식 (성공이지만 비효율)

### 접근

이미 정렬된 앞부분에 다음 좌석을 끼워 넣는다. 끼워 넣을 자리를 찾을 때까지, "더 뒤에 와야 할"(구역 번호가 더 크거나, 같으면 좌석 번호가 더 큰) 값들을 한 칸씩 밀어낸다.

```java
public static int[][] sortSeats(int[][] seats) {
    for (int i = 1; i < seats.length; i++) {
        int[] tmp = seats[i];
        int j = i;
        while (j > 0 &&
                (seats[j - 1][0] > tmp[0] ||
                        (seats[j - 1][0] == tmp[0] && seats[j - 1][1] > tmp[1]))) {
            seats[j] = seats[j - 1];
            j--;
        }
        seats[j] = tmp;
    }
    return seats;
}
```

### 결과

**성공** — 예제에서 정답과 같은 순서로 출력된다.

입력이 이미 정렬에 가까우면 시도 2보다 빠르지만, 최악의 경우(예매 순서가 정렬 순서와 정반대일 때)에는 여전히 N²에 비례한다. 좌석이 10만 개고 순서가 많이 뒤섞여 있다면 역시 제한 시간 1초를 넘길 수 있다.

### 분석

`while`문이 스스로 멈출 자리를 찾는다는 점에서 시도 2보다 낫지만, 이 문제는 예매 순서가 어떻게 뒤섞여 들어올지 보장이 없다. 최악의 입력을 기준으로 시간을 따져야 하는데, 최악의 경우 여전히 N²이므로 N=100,000에서 안전하다고 할 수 없다.

## 시도 4 — Comparable을 구현해 정렬하기 (성공, 채택)

### 접근

좌석 하나하나를 `Comparable<Seat>`을 구현한 클래스로 만들어, "구역 번호가 다르면 구역 번호로, 같으면 좌석 번호로" 비교하는 규칙을 `compareTo`에 한 번만 적어 둔다. 그 다음 정렬은 `Collections.sort`에 맡긴다.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public static int[][] sortSeats(int[][] seats) {
    List<Seat> list = new ArrayList<>();
    for (int[] seat : seats) {
        list.add(new Seat(seat[0], seat[1]));
    }
    Collections.sort(list);
    return list.stream()
            .map(seat -> new int[]{seat.zone, seat.number})
            .toArray(int[][]::new);
}

class Seat implements Comparable<Seat> {
    int zone, number;

    Seat(int zone, int number) {
        this.zone = zone;
        this.number = number;
    }

    @Override
    public int compareTo(Seat other) {
        if (this.zone == other.zone) return this.number - other.number;
        else return this.zone - other.zone;
    }
}
```

### 결과

**성공** — 예제에서 정답과 같은 순서로 출력된다.

복잡도: 시간 O(N log N)(`Collections.sort`는 병합 정렬 계열이라 비교 횟수가 N log N에 비례한다), 공간 O(N)(`Seat` 객체 목록). 좌석 10만 개를 정렬해도 수십 밀리초 안에 끝난다.

### 분석

시도 2, 3과 똑같은 "구역 먼저, 같으면 번호로" 규칙을 쓰지만, 그 규칙을 `compareTo` 한 곳에 적어두고 정렬 자체는 `Collections.sort`(내부적으로 병합 정렬)에 맡긴다는 점이 다르다. 병합 정렬은 "반으로 나누고 합치기"를 반복해서, 선택이나 버블, 삽입 정렬처럼 구간 전체를 매번 끝까지 훑지 않고도 정렬을 끝낸다 — 그 덕에 N이 10만이어도 비교 횟수가 N² 대신 N log N에 머문다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| 1. 선택 정렬 방식 | 구간 전체에서 최솟값 위치를 찾은 뒤 한 번만 교체 | O(N²) | 정답이지만 N=100,000이면 시간 초과 |
| 2. 버블 정렬 방식 | 인접 비교와 교환을 구간 전체에 반복 | O(N²) | 정답이지만 N=100,000이면 시간 초과 |
| 3. 삽입 정렬 방식 | 정렬된 앞부분에 끼워 넣기 | O(N²)(최악의 경우) | 정답이지만 최악의 경우 시간 초과 |
| **4. Comparable + Collections.sort (채택)** | 비교 규칙은 `compareTo`에, 정렬은 병합 정렬에 맡김 | O(N log N) | 정답 |

**채택: 시도 4.** 이 문제는 N이 최대 100,000이라 O(N²) 정렬은 제한 시간을 넘길 수 있다. 같은 "구역 먼저, 번호 나중" 규칙이라도, 그 규칙을 비교 한 번으로 표현해두고 검증된 정렬(`Collections.sort`)에 맡기면 N log N으로 끝난다.

- "정답은 맞지만 느리다"는 이 문제에서는 넘어갈 수 있는 흠이 아니다 — 제약(N=100,000, 1초)을 실제로 넘기는지 먼저 따져야 한다. 비슷한 선택이나 버블, 삽입 정렬이 N이 100 정도인 문제에서는 전혀 문제가 안 됐던 것과 대조된다.
- 자리 바꾸기(`swap`)처럼 "맨 마지막에 딱 한 번"만 해야 하는 연산은, 반복문 몸통 어디에 두느냐에 따라 완전히 다른 동작이 된다 — 구간을 다 훑어 최솟값 위치를 확정한 뒤에 바꿔야지, 훑는 도중에 바꾸면 아직 다 보지 않은 값들까지 뒤섞인다.
- 비교 기준이 "여러 값을 순서대로 따지는" 규칙(1순위가 같으면 2순위로)이라면, 그 규칙을 `Comparable`/`Comparator`로 한 곳에 모아두고 검증된 정렬에 맡기는 편이 안전하고, 더 큰 입력에서도 그대로 통한다.
