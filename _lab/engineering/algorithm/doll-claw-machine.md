---
title: "[스택] 크레인 인형뽑기 시뮬레이션"
excerpt: "N×N 격자에 쌓인 인형을 크레인으로 집어 바구니에 담을 때, 바구니에서 같은 모양이 연속으로 쌓이면 터져 사라진다. 모든 이동이 끝난 뒤 사라진 인형의 개수를 구한다."
date: 2026-11-18
tags:
  - 알고리즘
  - 스택
---

## 문제

N×N 크기의 격자 위에 인형이 쌓여 있다. 각 칸의 값은 인형의 모양 번호(1 이상)거나, 인형이 없는 빈 칸(0)이다. 같은 열에서는 인형이 바닥부터 빈틈없이 쌓여 있다.

크레인은 격자 위쪽에서 좌우로 움직이다 한 열에 멈추면, 그 열에서 **가장 위에 있는 인형**을 집어 올려 바구니에 넣는다. 바구니는 아래부터 차곡차곡 쌓이는데, **방금 넣은 인형이 바로 아래 인형과 모양이 같으면 둘 다 터져서 사라진다.** 인형이 없는 열에서 크레인을 작동시키면 아무 일도 일어나지 않는다.

크레인이 멈출 열의 순서(moves)가 전부 주어졌을 때, 모든 이동이 끝난 뒤 터져서 사라진 인형이 몇 개인지 센다.

- 5 ≤ N ≤ 30
- 격자의 각 칸은 0(빈 칸) 또는 1~100(인형 모양)
- moves의 길이 M은 1 이상 1,000 이하이고, 각 원소는 1 이상 N 이하
- 입력: 첫 줄 N, 다음 N줄에 걸쳐 격자(위에서부터), 그다음 줄에 M, 마지막 줄에 moves
- 출력: 터져서 사라진 인형의 개수

```
입력
5
0 0 2 0 0
0 1 0 0 4
3 1 2 0 2
3 5 5 1 4
2 5 3 1 4
8
2 4 1 4 2 3 2 5

출력
4
```

2번 열에서 모양1을 집어 바구니에 넣고, 이어서 4번 열에서도 모양1을 집으면 바구니 맨 위와 같아 둘이 터진다(바구니가 다시 빈다). 그 뒤 1번 열(모양3), 4번 열(모양1)을 차례로 쌓다가 2번 열에서 또 모양1을 집으면 바구니 맨 위(모양1)와 같아 다시 터진다. 나머지 이동에서는 터지는 일이 없어 총 4개가 사라진다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1154번 문제](https://oj.inflearn.com/problem/1154)(2019 카카오 신입 공채 1차 코딩테스트 문제)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 사라진 인형의 개수를 세는 `countPopped` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] board = new int[n][n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                board[i][j] = sc.nextInt();

        int m = sc.nextInt();
        int[] moves = new int[m];
        for (int i = 0; i < m; i++) moves[i] = sc.nextInt();

        System.out.println(countPopped(board, moves)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 열마다 스택, 바구니도 스택 (채택)

### 접근

격자를 세로로 자른 "열"마다 스택을 하나씩 만든다. 맨 아래 칸부터 위로 올라가며 채워 넣으면, 스택의 맨 위가 항상 "지금 그 열에서 크레인이 집을 수 있는 인형"이 된다. 바구니도 스택 하나로 표현해서, 집은 인형을 넣거나 맨 위와 같으면 둘 다 치운다.

```java
import java.util.Stack;

public static int countPopped(int[][] board, int[] moves) {
    int n = board.length;
    Stack<Integer>[] columns = new Stack[n];
    for (int j = 0; j < n; j++) {
        columns[j] = new Stack<>();
        for (int i = n - 1; i >= 0; i--) {
            if (board[i][j] == 0) continue;
            columns[j].push(board[i][j]);
        }
    }

    Stack<Integer> basket = new Stack<>();
    int popped = 0;
    for (int move : moves) {
        Stack<Integer> column = columns[move - 1];
        if (column.isEmpty()) continue;

        int picked = column.pop();
        if (!basket.isEmpty() && basket.peek() == picked) {
            basket.pop();
            popped += 2;
        } else {
            basket.push(picked);
        }
    }
    return popped;
}
```

### 결과

**성공** — 예제에서 `4` 출력.

복잡도: 시간 O(N² + M), 공간 O(N²). 격자를 열 스택으로 옮기는 데 N², 이동을 처리하는 데 M이 든다.

### 분석

`column.pop()`으로 **딱 한 번** 집은 값을 `picked`에 담아두고, 그 뒤로는 `picked`만 쓴다. 바구니와 비교할 때도 `basket.peek()`으로 "지금 맨 위가 뭔지"만 먼저 보고, 같을 때만 `basket.pop()`으로 실제로 치운다.

이렇게 "본다(`peek`)"와 "없앤다(`pop`)"의 역할을 나눠두는 게 중요하다. 만약 조건을 판단하는 자리에서 바로 `pop()`을 써버리면, 조건이 참이든 거짓이든 그 순간 상태가 이미 바뀌어버린다. 그러면 조건이 거짓이었을 때 "방금 집은 인형이 뭐였는지"를 다시 알 방법이 없어서, 그 값을 엉뚱한 곳에 다시 넣거나 아예 잃어버리기 쉽다. 반대로 `peek()`은 몇 번을 다시 봐도 상태가 바뀌지 않으니, **판단은 `peek()`으로 끝내고, 판단 결과에 따라 실제로 상태를 바꿀 때만 `pop()`을 쓰는** 순서를 지키면 이런 실수가 끼어들 자리가 없다.

## 다른 방법 — 스택 대신 배열과 인덱스로

각 열의 높이는 N을 넘지 않고, 바구니에 쌓일 수 있는 인형 수도 이동 횟수 M을 넘지 않는다. 즉 두 스택 모두 **최대 크기를 미리 알 수 있다.** 그렇다면 `Stack<Integer>` 객체 대신, 크기를 미리 잡아둔 배열과 "지금 맨 위가 몇 번째 칸인지"를 가리키는 인덱스로 똑같은 동작을 할 수 있다.

```java
public static int countPopped(int[][] board, int[] moves) {
    int n = board.length;
    int[] colTop = new int[n]; // 각 열에서 다음에 살펴볼 행(위에서부터)
    int[] basket = new int[moves.length];
    int basketTop = -1; // 바구니가 비어있으면 -1
    int popped = 0;

    for (int move : moves) {
        int j = move - 1;
        int picked = 0;
        while (colTop[j] < n) {
            int value = board[colTop[j]++][j];
            if (value != 0) {
                picked = value;
                break;
            }
        }
        if (picked == 0) continue; // 더 집을 인형이 없음

        if (basketTop >= 0 && basket[basketTop] == picked) {
            basketTop--;
            popped += 2;
        } else {
            basket[++basketTop] = picked;
        }
    }
    return popped;
}
```

`Stack<Integer>`를 쓰면 `Integer` 박싱과 내부 동기화 비용이 조금씩 붙는다. 미리 크기를 알 수 있는 상황이라 배열과 인덱스만으로도 "맨 위를 보고, 넣고, 뺀다"는 동작을 그대로 흉내 낼 수 있고, 기본형 `int` 배열이라 박싱도 없다. 복잡도는 시간 O(N² + M)로 같지만, 객체 생성과 박싱이 사라져 상수 비용이 더 가볍다.

다만 이 방법은 "최대 크기를 미리 안다"는 전제에 기댄다. 크기를 예측할 수 없는 상황이라면 크기가 자동으로 늘어나는 `Stack`이나 `ArrayDeque`가 더 안전하다.

## 다른 방법 — 보드를 직접 고치며 그 자리에서 찾기

전처리 없이, 이동할 때마다 그 열을 위에서부터 훑어 처음 만나는 0이 아닌 칸을 "지금 집히는 인형"으로 본다. 집었으면 그 자리를 0으로 바꿔두면, 다음에 그 열을 다시 찾을 때 자연히 그 아래 칸이 걸린다.

```java
public static int countPopped(int[][] board, int[] moves) {
    Stack<Integer> basket = new Stack<>();
    int popped = 0;
    for (int move : moves) {
        int j = move - 1;
        for (int i = 0; i < board.length; i++) {
            if (board[i][j] == 0) continue;
            int picked = board[i][j];
            board[i][j] = 0;
            if (!basket.isEmpty() && picked == basket.peek()) {
                basket.pop();
                popped += 2;
            } else {
                basket.push(picked);
            }
            break;
        }
    }
    return popped;
}
```

열마다 스택을 미리 만드는 과정이 통째로 사라져 코드가 가장 짧다. 복잡도는 시간 O(N×M)(이동마다 그 열을 최악 N칸까지 다시 훑는다), 공간 O(1)(바구니 제외, 보드를 그대로 재사용한다). 이 문제 크기(N≤30, M≤1,000)에서는 체감되지 않지만, 시도 1이나 앞의 "다른 방법"보다 이론상 더 느릴 수 있다.

복잡도보다 더 신경 쓰이는 건 `0`이라는 값의 쓰임이다. 예제 보드에서 `board[0][0]`은 **애초에** 인형이 없던 칸이라 0이다. 그런데 게임이 진행되며 `board[2][0]`에 있던 인형(3)을 집으면, 이 방법은 그 자리도 `board[2][0] = 0`으로 바꿔버린다. 결국 `board[0][0]`도 0, `board[2][0]`도 0이 되는데, 이 보드만 다시 들여다봐서는 "원래부터 없었다"와 "있었는데 집혀서 없어졌다"를 구분할 수 없다 — 이유가 다른 두 상황이 같은 값 하나로 뭉개진 것이다.

지금 문제는 이 차이가 중요하지 않다. 크레인이 궁금한 건 "지금 집을 인형이 있는가"뿐이고, 두 경우 다 답은 "없다"라 구분할 필요가 없다. 하지만 "원래 몇 칸이 비어 있었는지"처럼 두 상황을 나중에 구분해야 하는 질문이 추가된다면, 이 표현으로는 답할 수 없다. `board` 자체를 고쳐버리는 것도, 이 계산이 끝난 뒤 원래 보드가 다시 필요한 상황이라면 발목을 잡는다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 열마다 스택 (채택)** | `peek`으로 판단 후 필요할 때만 `pop` | 시간 O(N²+M), 공간 O(N²) | 정답 |
| 다른 방법. 배열 + 인덱스 | 크기를 미리 알고 배열로 대체 | 시간 O(N²+M), 공간 O(N²) | 정답, 박싱과 동기화 비용 없음 |
| 다른 방법. 보드를 직접 고치기 | 전처리 없이 그 자리에서 스캔 | 시간 O(N×M), 공간 O(1) | 정답, `0`의 의미가 두 가지가 됨 |

**채택: 시도 1.** 전처리가 한 단계 더 있지만, `0`이 끝까지 "빈 칸"이라는 뜻 하나만 유지하고 원본 보드도 그대로 남는다. 성능 차이가 체감되지 않는 이 문제 크기에서는, 값의 의미가 섞이지 않는 쪽을 택한다.

- 스택에서 조건을 판단할 땐 `peek()`으로 먼저 보고, 판단이 끝난 뒤 정말 상태를 바꿔야 할 때만 `pop()`을 쓴다. 조건 판단과 상태 변경을 한 번에 처리하면, 판단이 끝나기도 전에 값이 사라져 다른 분기에서 그 값을 잃어버리기 쉽다.
- 자료구조의 최대 크기를 미리 알 수 있다면, 범용 컨테이너 대신 배열과 인덱스로 같은 동작을 흉내 낼 수 있다. 다만 그 전제(크기를 안다는 것)가 깨지면 다시 범용 컨테이너로 돌아가야 한다.
- 같은 값으로 "원래 없던 것"과 "있다가 없어진 것"을 동시에 표시하면, 그 값만 보고는 둘을 구분할 수 없다. 구분이 필요해질 가능성이 있다면 처음부터 다른 방식으로 표시해야 한다.
