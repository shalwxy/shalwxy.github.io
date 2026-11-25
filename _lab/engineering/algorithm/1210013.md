---
title: "[해시] 문자열에서 애너그램 부분 문자열 세기"
excerpt: "긴 문자열 S에서, 짧은 문자열 T와 길이가 같고 철자 구성이 같은(애너그램인) 연속 부분 문자열이 몇 개인지 센다."
date: 2026-11-17
tags:
  - 알고리즘
  - 해시
---

## 문제

채팅방 로그 문자열 S 안에서, 금지 키워드 T와 길이가 같고 글자 구성이 완전히 같은(애너그램인) 연속 부분 문자열이 몇 개 있는지 센다. **대문자와 소문자는 서로 다른 글자로 구분한다.**

- S의 길이는 10,000을 넘지 않고, T의 길이는 S의 길이보다 작거나 같다
- 입력: 첫 줄에 S, 둘째 줄에 T
- 출력: T와 애너그램인 S의 부분 문자열 개수

```
입력                출력
nmomOmonm           3
mno
```

S의 1~3번째 글자(`nmo`)가 T(`mno`)와 같은 구성이다. 6~8번째 글자(`mon`)도 같고, 7~9번째 글자(`onm`)도 같다. 그 사이 4~5번째 자리에는 대문자 `O`가 섞여 있는데, 소문자 `o`와는 다른 글자로 세므로 그 구간은 애너그램이 아니다. 총 3개.

> 출처: 인프런 [자바(Java) 알고리즘 문제풀이 입문: 코딩테스트 대비](https://www.inflearn.com/course/자바-알고리즘-문제풀이-코테대비)의 [1142번 문제](https://oj.inflearn.com/problem/1142)를 소재와 예제만 바꿔 재구성했다.

## 공통 코드

아래 시도들은 입력을 읽고 결과를 출력하는 부분을 공유한다. 각 시도에서는 애너그램 부분 문자열의 개수를 세는 `countAnagramSubstrings` 메서드만 다르다.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s1 = sc.next();
        String s2 = sc.next();

        System.out.println(countAnagramSubstrings(s1, s2)); // 로직은 각 시도 참고
    }
}
```

## 시도 1 — 해시맵 하나로 넣고 빼며 비교 (채택)

### 접근

[두 단어가 애너그램인지 판별하기](/lab/engineering/algorithm/anagram-check/)의 "해시맵 하나 + 차감" 방식을, S 위에서 T 길이만큼의 창을 옮기며 반복한다. T의 글자 수를 센 `map2`와, 창 안의 글자 수를 센 `map1`이 같으면 그 창은 애너그램이다. 창은 T.length()−1개만 미리 채워두고, 반복문 한 바퀴마다 하나를 더 넣어 완성한 뒤 비교하고, 맨 앞 글자를 뺀다. `map2`는 자기 자신의 값을 보고 채우고, `lt`는 조건과 상관없이 매 바퀴 끝에서 **항상** 증가시킨다 — "개수가 0이면 키를 지운다"와 "창을 한 칸 옮긴다"는 서로 다른 일이라 문장도 따로 둔다.

T의 길이(이 문제의 예시에서는 3)만큼을 처음부터 다 채워두지 않고 T.length()−1개(2개)만 채워두는 이유도 같은 결이다. T의 길이만큼 다 채우면 첫 창은 반복문에 들어가기도 전에 이미 완성돼 있다. 그 첫 창을 T와 비교하려면 반복문 밖에서 한 번 더 비교해주거나, 반복문 안에서 "첫 바퀴만 넣지 않고 비교만 한다"는 예외를 둬야 한다. 한 글자를 모자라게 채워두면, 반복문의 모든 바퀴가 "한 글자 넣어서 창을 완성 → 비교 → 맨 앞 글자 빼기"를 예외 없이 똑같이 반복한다.

```java
import java.util.HashMap;
import java.util.Map;

public static int countAnagramSubstrings(String s1, String s2) {
    if (s1.length() < s2.length()) return 0;
    if (s1.length() == 0 || s2.length() == 0) return 0;

    Map<Character, Integer> map1 = new HashMap<>();
    Map<Character, Integer> map2 = new HashMap<>();

    for (char x : s2.toCharArray()) {
        map2.put(x, map2.getOrDefault(x, 0) + 1);
    }
    for (int i = 0; i < s2.length() - 1; i++) {
        map1.put(s1.charAt(i), map1.getOrDefault(s1.charAt(i), 0) + 1);
    }

    int ans = 0, lt = 0;
    for (int rt = s2.length() - 1; rt < s1.length(); rt++) {
        map1.put(s1.charAt(rt), map1.getOrDefault(s1.charAt(rt), 0) + 1);
        if (map1.equals(map2)) ans++;

        map1.put(s1.charAt(lt), map1.get(s1.charAt(lt)) - 1);
        if (map1.get(s1.charAt(lt)) == 0) map1.remove(s1.charAt(lt));
        lt++;
    }
    return ans;
}
```

### 결과

**성공** — 예제에서 `3` 출력.

복잡도: 시간 O(L1 + L2)(L1 = S의 길이, L2 = T의 길이), 공간 O(T에 나온 글자 종류). `lt`, `rt` 모두 S를 한 번씩만 지나간다.

### 분석

창을 "T.length()−1개 미리 채우고, 반복문 한 바퀴마다 하나 더 넣어 완성 → 비교 → 맨 앞 하나 빼기"로 설계한 이유는 [연속 K일 최대 대출 권수](/lab/engineering/algorithm/library-loan-window/)에서 k−1개를 미리 채운 이유와 같다 — 반복문의 모든 바퀴를 똑같이 만들고 싶어서다. 다만 창을 다루는 **방식** 자체는 다르다.

대출 권수 글의 창은 "빠지는 값을 빼고 들어오는 값을 더하는" 걸 `sum = sum - arr[lt] + arr[rt]`처럼 **한 번의 연산으로** 합쳤다. 합이라는 값은 어떤 순서로 더하고 빼도 결과가 같고, 그 중간에 "창이 완성된 상태"를 들여다볼 일도 없기 때문이다. 반면 여기서는 "창이 꽉 찬 상태가 T와 똑같은가"를 **그 순간에 직접** 봐야 한다. 그래서 들어오는 글자를 넣는 것과 나가는 글자를 빼는 것을 하나로 합칠 수 없고, 반드시 **넣기 → (그 사이에) 비교 → 빼기** 순서로 나눠야 한다. 비교할 "완성된 창"이라는 중간 상태가 필요한 문제인지 아닌지가, 창을 합쳐서 다룰 수 있는지를 가른다.

`lt`를 조건 없이 항상 증가시키는 것도 같은 결의 이유다 — 창의 크기(T의 길이)를 유지하는 일은 글자가 몇 개 남았는지와 무관하게 **매 바퀴 반드시 일어나야** 하고, 맵에서 키를 지우는 일은 그와 별개로 "개수가 0이 됐을 때만" 일어나는 부수적인 뒤처리일 뿐이다. 이 둘을 하나의 조건문에 묶으면, "매번 일어나야 할 일"이 "가끔만 일어나는 일"에 끌려가 버린다.

## 다른 방법 — 고정 크기 배열로 교체

[두 단어가 애너그램인지 판별하기](/lab/engineering/algorithm/anagram-check/)에서처럼, 대문자와 소문자 알파벳 전체가 올 수 있다는 걸 알고 있다면 해시맵 대신 `'z' - 'A' + 1`칸짜리 배열 두 개로 바꿀 수 있다.

```java
import java.util.Arrays;

public static int countAnagramSubstrings(String s1, String s2) {
    if (s1.length() < s2.length()) return 0;

    int[] cntS = new int['z' - 'A' + 1];
    int[] cntT = new int['z' - 'A' + 1];
    for (char x : s2.toCharArray()) cntT[x - 'A']++;
    for (int i = 0; i < s2.length() - 1; i++) cntS[s1.charAt(i) - 'A']++;

    int ans = 0, lt = 0;
    for (int rt = s2.length() - 1; rt < s1.length(); rt++) {
        cntS[s1.charAt(rt) - 'A']++;
        if (Arrays.equals(cntS, cntT)) ans++;
        cntS[s1.charAt(lt) - 'A']--;
        lt++;
    }
    return ans;
}
```

배열 칸은 비워두면 저절로 0이라서, 해시맵에서 하던 "개수가 0이 되면 키를 지운다"는 뒤처리 자체가 필요 없다 — 그냥 한 칸 깎아두면 끝이다. 복잡도는 시간 O(L1 + L2), 공간 O(1)(`'z' - 'A' + 1`이라는 고정 크기)로 해시맵 버전과 같은 차수지만, 해시 연산과 키 삭제 분기가 없어 비교(`Arrays.equals`)와 접근 모두 더 가볍다.

다만 이 배열은 `'Z'`와 `'a'` 사이의 쓰이지 않는 칸을 그대로 안고 간다. 알파벳이 아닌 문자가 섞이거나 어떤 문자가 올지 모른다면 해시맵 쪽이 안전하다.

## 정리

| 시도 | 핵심 | 복잡도 | 결과 |
|---|---|---|---|
| **1. 해시맵 하나로 넣고 빼며 비교 (채택)** | 넣기 → 비교 → 빼기, `lt++`는 항상 실행 | O(L1 + L2) | 성공 |
| 다른 방법. 고정 크기 배열 | 배열 칸을 그대로 두면 키 삭제가 필요 없음 | O(L1 + L2) | 성공, 알파벳 범위에 의존 |

**채택: 시도 1.** 창의 크기를 유지하는 `lt++`는 조건 없이 매번 일어나야 하고, 맵을 채울 때는 자기 자신의 값을 봐야 한다는 두 가지만 지키면, 해시맵으로도 충분히 단순하고 정확하게 풀린다.

- "매 바퀴 반드시 일어나야 하는 일"(여기서는 `lt++`, 창 크기 유지)과 "조건에 따라 가끔 일어나는 일"(개수가 0일 때 키를 지우는 뒤처리)을 하나의 `if` 안에 같이 넣지 않는다. 조건 안에 넣으면 조건이 거짓인 바퀴에는 "반드시 일어나야 할 일"까지 같이 건너뛰어 버린다.
- 창을 "완성 → 비교 → 줄이기"로 나눠야 하는 문제(중간에 완성된 상태를 직접 들여다봐야 하는 문제)와, "나가는 값 빼고 들어오는 값 더하기"를 한 번에 합칠 수 있는 문제([연속 K일 최대 대출 권수](/lab/engineering/algorithm/library-loan-window/)처럼 합계만 필요한 문제)는 창을 다루는 방식이 다르다.
