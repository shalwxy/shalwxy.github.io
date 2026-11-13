---
title: "[투 포인터] 두 반의 키 순서 합치기"
excerpt: "오름차순으로 정렬된 두 반의 키 순서 명단이 주어질 때, 두 명단을 합쳐 전체 학생을 키가 작은 순서로 나열한다."
date: 2026-11-10
tags:
  - 알고리즘
  - 투 포인터
---

## 문제

1반과 2반 학생들이 각각 키 순서로 줄을 섰다. 두 반의 줄은 이미 **키가 작은 순서(오름차순)**로 정렬되어 있다. 두 반을 합쳐 전체 학생을 키가 작은 순서로 나열한 명단을 만든다.

- 1반의 학생 수 N, 2반의 학생 수 M (1 ≤ N, M ≤ 100)
- 각 학생의 키는 int 범위를 넘지 않는 정수
- 입력: 첫 줄에 N, 둘째 줄에 1반 학생 N명의 키(오름차순). 셋째 줄에 M, 넷째 줄에 2반 학생 M명의 키(오름차순)
- 출력: 두 반을 합쳐 키가 작은 순서로 나열한 명단

```
입력                    출력
4                       132 138 140 145 145 151 160
132 140 145 151
3
138 145 160
```

1반의 132가 전체에서 가장 작아 맨 앞에 온다. 1반의 145와 2반의 145처럼 값이 같을 때는 어느 쪽을 먼저 둬도 전체 순서는 바뀌지 않는다(둘 다 그대로 적힌다). 2반의 160이 가장 커서 맨 끝에 온다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1128번 문제](https://oj.inflearn.com/problem/1128)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 두 배열을 합치는 `merge` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr1 = new int[n];
        for (int i = 0; i < n; i++) arr1[i] = sc.nextInt();
        int m = sc.nextInt();
        int[] arr2 = new int[m];
        for (int i = 0; i < m; i++) arr2[i] = sc.nextInt();

        int[] answer = merge(arr1, arr2); // 병합 로직은 각 시도 참고
        for (int x : answer) System.out.print(x + " ");
    }
}
```

## 시도 1 — 포인터가 소진되면 -1로 표시

### 접근

포인터 `i`, `j`로 두 배열을 동시에 가리키며, 더 작은 값을 결과 배열에 채우고 그 포인터만 전진시킨다. 포인터가 배열의 마지막 원소를 채우고 나면 `-1`로 바꿔 "이 배열은 다 썼다"는 표시로 쓴다. 이후에는 그 분기에서 남은 배열의 값만 그대로 채운다.

```java
public static int[] merge(int[] arr1, int[] arr2) {
    int[] answer = new int[arr1.length + arr2.length];
    for (int i = 0, j = 0, k = 0; k < answer.length; k++) {
        if (i == -1) {
            answer[k] = arr2[j++];
        } else if (j == -1) {
            answer[k] = arr1[i++];
        } else if (arr1[i] <= arr2[j]) {
            answer[k] = arr1[i];
            if (i == arr1.length - 1) i = -1; else i++;
        } else {
            answer[k] = arr2[j];
            if (j == arr2.length - 1) j = -1; else j++;
        }
    }
    return answer;
}
```

### 결과

**성공** — 예제에서 `132 138 140 145 145 151 160` 출력.

복잡도: 시간 O(N+M), 공간 O(N+M). 두 배열의 원소를 정확히 한 번씩만 본다.

한쪽 포인터가 `-1`이 되면 그 뒤로는 `i == -1`/`j == -1` 분기만 타면서 남은 배열을 그대로 옮긴다.

### 분석

`i`, `j`는 "다음에 볼 인덱스"와 "이 배열은 끝났다"라는 **두 가지 의미**를 동시에 띤다. 분기도 정상 비교 두 가지(`arr1[i] <= arr2[j]`와 그 반대)와 종료 신호 두 가지(`i == -1`, `j == -1`)가 뒤섞여 있어서, 처음 읽을 때 "-1이면 끝났다"는 규칙부터 따로 기억해야 한다. 배열을 하나 더 합치려 해도 이 구조를 그대로 늘릴 수 없다 — 포인터마다 종료 신호와 분기를 다시 짜야 한다.

## 시도 2 — 포인터 범위로만 판단 (채택)

### 접근

강의에서 설명한 방식대로, 별도의 종료 신호 없이 `while` 조건 자체로 "두 배열 모두 아직 남았는지"를 확인했다. 조건이 깨지면(한쪽이 끝나면) 루프를 빠져나와, 남은 배열을 `while` 두 개로 각각 이어 붙인다.

```java
import java.util.ArrayList;
import java.util.List;

public static int[] merge(int[] arr1, int[] arr2) {
    List<Integer> answer = new ArrayList<>();
    int p1 = 0, p2 = 0;
    while (p1 < arr1.length && p2 < arr2.length) {
        if (arr1[p1] < arr2[p2]) answer.add(arr1[p1++]);
        else answer.add(arr2[p2++]);
    }
    while (p1 < arr1.length) answer.add(arr1[p1++]);
    while (p2 < arr2.length) answer.add(arr2[p2++]);
    return answer.stream().mapToInt(Integer::intValue).toArray();
}
```

### 결과

**성공** — 예제에서 동일하게 `132 138 140 145 145 151 160` 출력.

복잡도: 시간 O(N+M), 공간 O(N+M). 비교 기준이 포인터 범위로 바뀌었을 뿐, 원소를 보는 횟수는 시도 1과 같다.

한쪽 배열이 먼저 끝나면 첫 `while`을 빠져나오고, 남은 두 `while` 중 조건이 참인 하나만 돈다.

### 분석

`while (p1 < arr1.length && p2 < arr2.length)`라는 조건 자체가 "둘 다 아직 안 끝났다"는 뜻이라서, "끝났다"를 따로 저장할 변수가 필요 없다. 포인터가 배열 길이에 닿으면 조건이 저절로 거짓이 되어 루프를 빠져나오고, 그 뒤 남은 두 `while` 중 조건이 참인 쪽만 돌며 나머지를 채운다. `i`, `j`가 `-1`이라는 특수값을 가질 일이 없어 인덱스라는 뜻 하나만 유지한다. 그래서 배열을 하나 더 합치고 싶으면 포인터 하나와 `while` 하나만 추가하면 된다.

## 다른 방법 — 합친 뒤 정렬

"정렬된 두 배열을 합친다"는 조건을 쓰지 않고, 두 배열을 이어 붙인 뒤 통째로 정렬하는 방법도 있다.

```java
int[] answer = new int[arr1.length + arr2.length];
System.arraycopy(arr1, 0, answer, 0, arr1.length);
System.arraycopy(arr2, 0, answer, arr1.length, arr2.length);
Arrays.sort(answer);
```

복잡도는 시간 O((N+M)log(N+M)), 공간 O(N+M)으로 시도 2보다 느리다. 그 대신 입력이 정렬되어 있다는 가정이 전혀 필요 없어 코드가 세 줄로 줄어든다. 입력이 항상 정렬되어 온다는 보장이 깨질 수 있거나, N과 M이 작아 로그 배수 차이가 체감되지 않을 때는 이쪽이 더 안전하다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| 1. -1로 종료 표시 | 포인터가 인덱스와 종료 신호를 겸함 | O(N+M) | 정답, 확장하기 어려움 |
| **2. 포인터 범위로 판단 (채택)** | `while` 조건이 곧 "둘 다 안 끝났다" | O(N+M) | 정답, 종료 신호 없음 |
| 다른 방법. 합친 뒤 정렬 | 정렬 가정을 버리고 다시 정렬 | O((N+M)log(N+M)) | 정답, 코드 세 줄 |

**채택: 시도 2.** 복잡도는 시도 1과 같지만, 포인터가 인덱스라는 뜻 하나만 가지고 종료 조건이 `while`에 그대로 드러나 가장 읽기 쉽고, 배열을 늘려도 구조를 바꿀 필요가 없다.

- 포인터가 "끝났는지"를 **별도의 값(예: -1)으로 표시**하면 그 포인터는 인덱스와 플래그 두 가지 의미를 동시에 갖게 된다. 가능하면 `while (p < len)`처럼 **반복 조건 자체가 "아직 안 끝났다"를 뜻하게** 만드는 쪽이 읽기 쉽다.
- "이미 정렬되어 있다"는 입력 조건은 그 자체로 **선형 시간에 합칠 수 있다는 힌트**다. 조건을 버리고 다시 정렬하면 항상 정답이지만 로그 배수만큼 느리다.
