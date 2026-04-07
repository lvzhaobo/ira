function getPayload() {
  return {
    prompt: $("#prompt").val().trim(),
    workspace: $("#workspace").val().trim() || null,
    timeout: Number($("#timeout").val() || 300),
  };
}

function renderOutput(obj) {
  $("#output").text(JSON.stringify(obj, null, 2));
}

function pollJob(jobId) {
  const timer = setInterval(() => {
    $.getJSON(`/api/jobs/${jobId}`)
      .done((res) => {
        renderOutput(res);
        const status = res?.job?.status;
        if (status === "done" || status === "failed") {
          clearInterval(timer);
        }
      })
      .fail((xhr) => {
        clearInterval(timer);
        renderOutput({ ok: false, error: xhr.responseText || "轮询失败" });
      });
  }, 1500);
}

$("#runSync").on("click", () => {
  const payload = getPayload();
  payload.save_to_file = true;
  if (!payload.prompt) {
    renderOutput({ ok: false, error: "prompt 不能为空" });
    return;
  }
  $.ajax({
    url: "/api/run",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
  })
    .done((res) => renderOutput(res))
    .fail((xhr) => renderOutput({ ok: false, error: xhr.responseText || "请求失败" }));
});

$("#runAsync").on("click", () => {
  const payload = getPayload();
  if (!payload.prompt) {
    renderOutput({ ok: false, error: "prompt 不能为空" });
    return;
  }
  $.ajax({
    url: "/api/jobs",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
  })
    .done((res) => {
      renderOutput(res);
      if (res?.job_id) {
        pollJob(res.job_id);
      }
    })
    .fail((xhr) => renderOutput({ ok: false, error: xhr.responseText || "请求失败" }));
});

$("#loadJobs").on("click", () => {
  $.getJSON("/api/jobs")
    .done((res) => $("#jobs").text(JSON.stringify(res, null, 2)))
    .fail((xhr) => $("#jobs").text(xhr.responseText || "加载失败"));
});
