import cv2
import mediapipe as mp
import time
import json

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

# initializing webcam
cap = cv2.VideoCapture(0)

# mediapipe hands setup for hand detection
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)

prev_time = 0

while True:
    success, frame = cap.read()
    if not success:
        break

    # flip the frame for natural view
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    result = hands.process(rgb_frame)

    if result.multi_hand_landmarks:
        for handLms in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, handLms, mp_hands.HAND_CONNECTIONS)

            # extract landmark coordinates
            landmarks = []
            for id, lm in enumerate(handLms.landmark):
                h, w, c = frame.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                landmarks.append((id, cx, cy))

            # example: thumb tip is id 4, index tip is id 8
            thumb_tip = landmarks[4][1:]
            index_tip = landmarks[8][1:]
            index_up = landmarks[8][2] < landmarks[6][2]
            middle_up = landmarks[12][2] < landmarks[10][2]
            ring_up = landmarks[16][2] < landmarks[14][2]
            pinky_up = landmarks[20][2] < landmarks[18][2]

            # compute simple distance between thumb and index tip
            dist = ((thumb_tip[0]-index_tip[0])**2 + (thumb_tip[1]-index_tip[1])**2)**0.5

            gesture = None
            if dist < 50:
                gesture = "pinch"
            elif dist > 200:
                gesture = "open_palm"
            if index_up and middle_up and not ring_up:
                gesture = "V_sign"
            elif not any([index_up, middle_up, ring_up, pinky_up]):
                gesture = "fist"

            if gesture:
                event = {"gesture": gesture, "timestamp": time.time()}
                print(json.dumps(event))

    # FPS counter
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time) if prev_time else 0
    prev_time = curr_time
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    cv2.imshow("AI Vision Assistant - Gesture Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
