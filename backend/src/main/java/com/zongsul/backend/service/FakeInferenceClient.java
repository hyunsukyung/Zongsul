package com.zongsul.backend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 실제 모델 없이도 프론트 시연을 위해 쓰는 가짜 구현
 * - 계란찜 / 김자반 / 시금치에 대해 랜덤 값 생성
 * - 나중에 진짜 FastAPI 연동할 거면 HttpInferenceClient를 만들고 Bean 교체하면 됨
 */
@Service
@ConditionalOnProperty(name = "inference.mode", havingValue = "fake", matchIfMissing = true)
public class FakeInferenceClient implements InferenceClient {

    private final Random random = new Random();

    private static final List<String> TARGET_FOODS =
            List.of("계란찜", "김자반", "시금치");

    @Override
    public Map<String, Double> infer(byte[] imageBytes, String filename) {
        Map<String, Double> out = new LinkedHashMap<>();

        // 0.0 ~ 1.0 사이 랜덤 값 생성 후, 합이 1이 되도록 정규화
        double[] raw = new double[TARGET_FOODS.size()];
        double sum = 0.0;
        for (int i = 0; i < raw.length; i++) {
            raw[i] = 0.1 + random.nextDouble(); // 최소 0.1은 주기
            sum += raw[i];
        }

        for (int i = 0; i < TARGET_FOODS.size(); i++) {
            double ratio = raw[i] / sum; // 0.0 ~ 1.0
            ratio = Math.round(ratio * 1000.0) / 1000.0; // 소수 셋째 자리까지
            out.put(TARGET_FOODS.get(i), ratio);
        }

        return out;
    }
}
