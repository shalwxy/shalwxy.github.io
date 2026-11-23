---
title: "[배열] 최근 연 파일 목록 관리하기"
excerpt: "최근에 연 파일을 앞에 두는 목록을 최대 개수로만 유지할 때, 파일을 열 때마다 목록이 어떻게 바뀌는지 구한다."
date: 2026-11-23 15:15:19 +0900
tags:
  - 알고리즘
  - 배열
---

## 문제

문서 편집기는 사용자가 연 파일을 "최근 파일" 목록에 최대 S개까지 유지한다. 목록은 가장 최근에 연 파일이 맨 앞에 오도록 다음 규칙을 따른다.

- 이미 목록에 있는 파일을 다시 열면, 그 파일을 목록 맨 앞으로 옮긴다(목록에 있는 파일 수는 변하지 않는다).
- 목록에 없는 파일을 열면, 그 파일을 목록 맨 앞에 추가한다. 이때 목록이 이미 S개로 꽉 차 있었다면, 가장 오래전에 연(목록 맨 뒤의) 파일을 목록에서 내보낸다.

사용자가 파일을 연 순서가 주어질 때, 마지막 파일을 연 뒤 목록에 남아있는 파일을 최근에 연 순서대로 출력한다.

- 목록에 유지할 수 있는 최대 파일 수 S(3 ≤ S ≤ 10), 사용자가 파일을 연 횟수 N(5 ≤ N ≤ 1,000)
- 파일 번호는 1 이상 100 이하의 정수
- 입력: 첫 줄에 S와 N, 둘째 줄에 사용자가 연 순서대로 N개의 파일 번호
- 출력: 목록에 남은 파일을 최근에 연 순서대로

```
입력
4 8
3 5 2 5 8 2 9 5

출력
5 9 2 8
```

파일을 하나씩 열 때마다 목록이 어떻게 바뀌는지 짚어보면:

| 연 파일 | 그 직후 목록(최근 순) |
|---|---|
| 3 | 3 |
| 5 | 5 3 |
| 2 | 2 5 3 |
| 5 | 5 2 3 (이미 있던 5가 맨 앞으로) |
| 8 | 8 5 2 3 (목록이 4개로 꽉 참) |
| 2 | 2 8 5 3 (이미 있던 2가 맨 앞으로) |
| 9 | 9 2 8 5 (꽉 찬 상태에서 새 파일 → 맨 뒤 3을 내보냄) |
| 5 | 5 9 2 8 (이미 있던 5가 맨 앞으로) |

마지막 줄이 정답 `5 9 2 8`이다.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1168번 문제](https://oj.inflearn.com/problem/1168)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 목록을 갱신하는 `recentList` 메서드만 다르다. 목록이 아직 S개로 다 채워지지 않았다면 빈 자리는 0으로 둔다(파일 번호는 항상 1 이상이라 실제 파일과 헷갈릴 일은 없다).

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int s = sc.nextInt();
        int n = sc.nextInt();
        int[] opened = new int[n];
        for (int i = 0; i < n; i++) opened[i] = sc.nextInt();

        int[] recent = recentList(s, opened); // 로직은 각 시도 참고

        StringBuilder sb = new StringBuilder();
        for (int file : recent) sb.append(file).append(' ');
        System.out.println(sb.toString().trim());
    }
}
```

## 시도 1 — 목록 전체에서 위치를 찾은 뒤 그 앞부분만 밀기 (성공, 채택)

### 접근

지금 연 파일이 목록 어디에 있는지(`pos`) 목록 전체를 다 뒤져서 찾는다. 있었다면(`pos`가 유효한 인덱스) 그 앞에 있던 파일들만 한 칸씩 뒤로 밀어 `pos`자리를 비우고, 없었다면(`pos == -1`) 목록 전체를 한 칸씩 밀어 맨 뒤 파일을 내보낸다. 어느 쪽이든 마지막엔 맨 앞자리에 지금 연 파일을 놓는다.

```java
public static int[] recentList(int s, int[] opened) {
    int[] recent = new int[s];

    for (int file : opened) {
        int pos = -1;
        for (int i = 0; i < s; i++) {
            if (file == recent[i]) {
                pos = i;
            }
        }

        if (pos == -1) {
            for (int i = s - 1; i >= 1; i--) {
                recent[i] = recent[i - 1];
            }
        } else {
            for (int i = pos; i >= 1; i--) {
                recent[i] = recent[i - 1];
            }
        }
        recent[0] = file;
    }

    return recent;
}
```

### 결과

**성공** — 예제에서 `5 9 2 8` 출력.

복잡도: 시간 O(S×N)(파일을 열 때마다 목록 S칸을 훑어 위치를 찾고, 그만큼 밀어야 한다), 공간 O(S).

### 분석

`pos`를 구하는 루프에서 목록 **전체**를 끝까지 훑어 지금 연 파일이 있는 정확한 위치를 찾은 뒤에야 분기한다. 위치를 찾았으면(`pos`가 그 값) 그 앞부분(`0`~`pos-1`)만 한 칸씩 밀어 `pos`자리를 비우고, 못 찾았으면(`pos == -1`) 목록 전체를 밀어 맨 뒤를 내보낸다 — "맨 앞으로 옮긴다"는 문제의 규칙을 그대로 코드로 옮긴 것이다.

## 다른 방법 — LinkedList로 작성하기

배열에서 직접 자리를 미는 대신, `LinkedList`의 `remove`(값으로 제거), `addFirst`, `removeLast`를 쓰면 "찾아서 맨 앞으로"라는 규칙을 더 짧게 표현할 수 있다.

```java
import java.util.LinkedList;

public static int[] recentList(int s, int[] opened) {
    LinkedList<Integer> recent = new LinkedList<>();

    for (int file : opened) {
        recent.remove(Integer.valueOf(file)); // 목록에 없으면 아무 일도 안 함
        recent.addFirst(file);
        if (recent.size() > s) {
            recent.removeLast();
        }
    }

    int[] result = new int[s];
    for (int i = 0; i < s; i++) {
        result[i] = i < recent.size() ? recent.get(i) : 0;
    }
    return result;
}
```

`remove(Integer.valueOf(file))`도 내부적으로 목록을 끝까지 훑으며 값을 찾으므로 복잡도는 시도 1과 같은 O(S×N)이다. 대신 "있으면 지우고 맨 앞에 넣는다, 넘치면 맨 뒤를 지운다"는 규칙이 코드 세 줄로 그대로 드러나서, 자리를 미는 반복문을 직접 쓰지 않아도 된다. 다만 `Integer` 박싱과 연결 리스트 노드 때문에 같은 크기에서 배열보다 메모리를 더 쓴다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 전체에서 위치 찾기 (채택)** | `pos`를 끝까지 찾은 뒤 그 앞부분만 밀기 | O(S×N) | 정답 |
| 다른 방법. LinkedList | `remove`→`addFirst`→필요시 `removeLast` | O(S×N) | 정답, 코드가 더 짧음 |

**채택: 시도 1.** 목록 전체를 봐야 "이미 있는 파일인지"를 제대로 판단할 수 있고, S가 10 이하로 작아 매번 전체를 훑어도 충분히 빠르다.

- 최근 항목을 앞에 유지하는 목록(LRU류)은 "항목을 찾은 위치까지만 밀고, 그 뒤는 그대로 둔다"는 패턴으로 구현한다. 못 찾았을 때(새 항목)는 "목록 전체를 밀고 맨 뒤를 버린다"로 자연스럽게 통합된다 — 찾은 위치가 없다는 것은 곧 맨 끝(목록 길이)에서 찾은 것과 같기 때문이다.
