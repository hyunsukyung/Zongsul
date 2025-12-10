from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from ultralytics import YOLO
import io
import cv2

app = FastAPI()

# CORS (프론트엔드 호출 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------
# YOLO model
# ---------------------
model = YOLO("best.pt")   # 같은 폴더에 있어야 함
class_names = ["계란찜", "김자반", "시금치"]
num_classes = len(class_names)


@app.post("/inference")
async def inference(file: UploadFile = File(...)):
    # =================================================
    # 1) 이미지 로드 (PIL 사용)
    # =================================================
    contents = await file.read()

    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        return {"error": f"이미지 로딩 실패: {str(e)}"}

    # =================================================
    # 2) YOLO 훈련 데이터와 동일한 해상도로 강제 변환
    #    (훈련 데이터에서 가장 흔한 형태인 640x512로 resize)
    # =================================================
    pil_image = pil_image.resize((640, 512))   # (width, height)

    # =================================================
    # 3) YOLO 추론 (PIL 이미지를 직접 전달)
    # =================================================
    # 내부적으로 YOLO가 자체 전처리(resize, normalize) 적용
    result = model(pil_image, conf=0.01)[0]

    # YOLO 디버깅 로그
    print("\n=== YOLO DEBUG ===")
    print("masks:", result.masks)
    print("boxes:", result.boxes)

    # =================================================
    # 4) 세그멘테이션 없으면 바로 return
    # =================================================
    if result.masks is None:
        return {
            "message": "no detections",
            "class_percentages": {name: 0.0 for name in class_names}
        }

    masks = result.masks.data.cpu().numpy()
    cls_ids = result.boxes.cls.cpu().numpy().astype(int)

    # 이미지 크기
    img = np.array(pil_image)
    h, w = img.shape[:2]

    # =================================================
    # 5) 클래스별 마스크 합치기
    # =================================================
    class_masks = {i: np.zeros((h, w), dtype=np.uint8) for i in range(num_classes)}

    MIN_AREA = 1   # 작은 마스크도 검출 가능하게 설정

    for inst_mask, cls in zip(masks, cls_ids):
        inst_mask = (inst_mask > 0.5).astype(np.uint8)

        # YOLO 마스크는 640x640일 확률 높음 → 원본 크기로 resize
        resized_mask = cv2.resize(inst_mask, (w, h), interpolation=cv2.INTER_NEAREST)

        if resized_mask.sum() < MIN_AREA:
            continue

        class_masks[cls] = np.maximum(class_masks[cls], resized_mask)

    # =================================================
    # 6) 픽셀 비율 계산
    # =================================================
    pixel_counts = {i: class_masks[i].sum() for i in range(num_classes)}
    total_pixels = h * w

    ratios = {
        class_names[i]: (pixel_counts[i] / total_pixels) * 100
        for i in range(num_classes)
    }

    # =================================================
    # 7) JSON으로 반환
    # =================================================
    return {
        "class_percentages": ratios
    }
