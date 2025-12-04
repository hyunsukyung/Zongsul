package com.zongsul.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final InferenceClient inferenceClient;
    private FridayAnalysisResult latestFridayResult;

    public AnalysisService(InferenceClient inferenceClient) {
        this.inferenceClient = inferenceClient;
    }

    public void analyzeFridayImages(List<MultipartFile> images) throws IOException {

        log.info("[Analysis] Start Friday images analysis. imageCount={}", images != null ? images.size() : 0);

        Map<String, Double> sum = new HashMap<>();
        int count = images.size();

        for (MultipartFile file : images) {
            Map<String, Double> result = inferenceClient.infer(
                    file.getBytes(),
                    file.getOriginalFilename()
            );

            for (String key : result.keySet()) {
                sum.merge(key, result.get(key), Double::sum);
            }
        }

        Map<String, Double> avg = new HashMap<>();
        for (String key : sum.keySet()) {
            avg.put(key, sum.get(key) / count);
        }

        String least = avg.entrySet()
                .stream()
                .max(Comparator.comparingDouble(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse("없음");

        Map<String, List<String>> relatedMap = Map.of(
                "계란찜", List.of("두부조림", "야채무침"),
                "김자반", List.of("멸치볶음", "콩나물무침"),
                "시금치", List.of("브로콜리", "고사리나물")
        );

        List<String> related = relatedMap.getOrDefault(least, List.of());

        latestFridayResult = new FridayAnalysisResult(avg, least, related);

        log.info("[Analysis] Finished Friday analysis. winner={}, avg={}, related={}", least, avg, related);
    }

    public FridayAnalysisResult getLatestResult() {
        if (latestFridayResult == null) {
            return new FridayAnalysisResult(
                    Map.of("계란찜", 0.3, "김자반", 0.3, "시금치", 0.3),
                    "계란찜",
                    List.of("두부조림")
            );
        }
        return latestFridayResult;
    }
}
