(() => {
  const video = document.createElement("video");
  const targetCanvas = document.getElementById("target");
  const previewCanvas = document.getElementById("preview");
  const startButton = document.getElementById("start");
  const screenShareButton = document.getElementById("startScreenShare");
  const tctx = targetCanvas.getContext("2d");
  const pctx = previewCanvas.getContext("2d");

  let isScreenShoting = false;
  let isScreenSharing = false;
  let isDrawing = false;

  let sx = 0;
  let sy = 0;
  let sw = 0;
  let sh = 0;

  let scaleX = 1;
  let scaleY = 1;

  let stream = null;
  let captureStream = null;

  const playVideo = async (stream) => {
    video.srcObject = stream;
    video.width = targetCanvas.width;
    video.height = targetCanvas.height;

    await video.play();

    console.log(
      "video: ",
      video,
      video.width,
      video.height,
      video.videoWidth,
      video.videoHeight
    );

    // drawImage 在绘制时使用源元素的css大小，而不是元素的大小
    // 例如 图形使用 naturalWidth 和 naturalHeight；
    // video 使用 videoWidth 和 videoHeight
    scaleX = video.videoWidth / video.width;
    scaleY = video.videoHeight / video.height;
  };

  const main = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    await playVideo(stream);

    refresh();
  };

  const refresh = () => {
    tctx.drawImage(video, 0, 0, targetCanvas.width, targetCanvas.height);
    pctx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);

    if (sx && sy && sw && sh) {
      tctx.strokeRect(sx, sy, sw, sh);
      tctx.strokeStyle = "red";

      if (isScreenShoting) {
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(
          video,
          sx * scaleX,
          sy * scaleY,
          sw * scaleX,
          sh * scaleY,
          sx,
          sy,
          sw,
          sh
        );
      }
    }

    window.requestAnimationFrame(refresh);
  };

  startButton.addEventListener("click", () => {
    isScreenShoting = !isScreenShoting;
    startButton.innerText = isScreenShoting ? "停止截图" : "开始截图";
  });

  screenShareButton.addEventListener("click", async () => {
    if (!captureStream) {
      captureStream = await navigator.mediaDevices.getDisplayMedia();

      // 浏览器原生的停止共享
      captureStream.getVideoTracks()[0].onended = async () => {
        captureStream = null;
        await playVideo(stream);

        isScreenSharing = false;
        screenShareButton.innerText = "开始屏幕共享";
      };

      await playVideo(captureStream);
    } else {
      // 手动停止共享
      captureStream.getVideoTracks()[0].onended = null;
      captureStream.getTracks().forEach((track) => track.stop());
      captureStream = null;
      await playVideo(stream);
    }

    isScreenSharing = !isScreenSharing;
    screenShareButton.innerText = isScreenSharing
      ? "结束屏幕共享"
      : "开始屏幕共享";
  });

  targetCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    tctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    sx = e.offsetX;
    sy = e.offsetY;
    sw = 0;
    sh = 0;
  });

  targetCanvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) {
      return;
    }
    sw = e.offsetX - sx;
    sh = e.offsetY - sy;
  });

  targetCanvas.addEventListener("mouseup", (e) => {
    isDrawing = false;
    sw = e.offsetX - sx;
    sh = e.offsetY - sy;

    if (!isScreenShoting) {
      console.error("请点击开始截图后再操作");
    }
  });

  targetCanvas.addEventListener("mouseleave", (e) => {
    if (isDrawing) {
      console.warn("超出边界了，停止截图");
      isDrawing = false;
      sw = e.offsetX - sx;
      sh = e.offsetY - sy;
    }
  });

  main();
})();
