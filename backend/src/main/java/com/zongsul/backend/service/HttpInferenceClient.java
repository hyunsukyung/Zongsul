package com.zongsul.backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "inference.mode", havingValue = "http")
public class HttpInferenceClient implements InferenceClient {

    private static final Logger log = LoggerFactory.getLogger(HttpInferenceClient.class);

    @Value("${inference.server.url}")
    private String serverUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private record FastApiResponse(
            @JsonProperty("class_percentages")
            Map<String, Double> classPercentages
    ) {}

    @Override
    public Map<String, Double> infer(byte[] imageBytes, String filename) {
        try {
            log.info("[Inference] Sending image '{}' to AI server: {} ({} bytes)", filename, serverUrl, imageBytes != null ? imageBytes.length : 0);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> req = new HttpEntity<>(body, headers);

            String respJson = restTemplate.postForObject(serverUrl, req, String.class);

            log.debug("[Inference] Raw response JSON: {}", respJson);

            FastApiResponse resp = objectMapper.readValue(respJson, FastApiResponse.class);

            Map<String, Double> result = resp != null && resp.classPercentages() != null
                    ? resp.classPercentages()
                    : Collections.emptyMap();

            log.info("[Inference] Received result from AI server: {}", result);

            return result;

        } catch (Exception e) {
            log.error("[Inference] Error while calling AI server {}: {}", serverUrl, e.getMessage(), e);
            return Collections.emptyMap();
        }
    }
}
