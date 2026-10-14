const statusClassMap = {
  private: "status-private",
  pending: "status-pending",
  interview: "status-interview",
  accepted: "status-accepted",
  reserve: "status-reserve",
  rejected: "status-rejected"
};

const elements = {
  totalCount: document.querySelector("#total-count"),
  publicCount: document.querySelector("#public-count"),
  interviewCount: document.querySelector("#interview-count"),
  selectedCount: document.querySelector("#selected-count"),
  privateCount: document.querySelector("#private-count"),
  privateBanner: document.querySelector("#private-banner"),
  applicationList: document.querySelector("#application-list"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#search-input"),
  statusFilter: document.querySelector("#status-filter"),
  lastUpdated: document.querySelector("#last-updated"),
  dialog: document.querySelector("#detail-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogBody: document.querySelector("#dialog-body"),
  closeDialog: document.querySelector("#close-dialog")
};

function escapeHtml(value = "") {
  const temporaryElement = document.createElement("div");
  temporaryElement.textContent = value;
  return temporaryElement.innerHTML;
}

function getVisibleApplications() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const selectedStatus = elements.statusFilter.value;

  return applications.filter((application) => {
    const searchableText = [
      application.university,
      application.faculty,
      application.program,
      application.project,
      application.campus
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" ||
      application.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });
}

function renderStats() {
  const total = applications.length;

  const publicApplications = applications.filter(
    (application) => application.public
  ).length;

  const interviewApplications = applications.filter(
    (application) =>
      application.status === "interview" ||
      application.interviewResult === "ผ่านการสัมภาษณ์"
  ).length;

  const selectedApplications = applications.filter(
    (application) => application.selected
  ).length;

  const privateApplications = applications.filter(
    (application) => !application.public
  ).length;

  elements.totalCount.textContent = total;
  elements.publicCount.textContent = publicApplications;
  elements.interviewCount.textContent = interviewApplications;
  elements.selectedCount.textContent = selectedApplications;
  elements.privateCount.textContent = privateApplications;

  elements.privateBanner.hidden = privateApplications === 0;
}

function renderApplicationCard(application, index) {
  if (!application.public) {
    return `
      <article class="application-card is-private">
        <div class="private-card-content">
          <div>
            <div class="card-meta">
              <span class="card-number">
                รายการที่ ${String(index + 1).padStart(2, "0")}
              </span>

              <span class="status status-private">
                ยังไม่เปิดเผยข้อมูล
              </span>
            </div>

            <h3>รายละเอียดสาขานี้ยังไม่เปิดเผย</h3>

            <p>
              ข้อมูลจะเปิดเผยหลังสิ้นสุดการรับสมัครและประกาศผลอย่างเป็นทางการ
            </p>
          </div>

          <span class="private-lock" aria-hidden="true">•••</span>
        </div>
      </article>
    `;
  }

  const resultText = application.selected
    ? "ยืนยันสิทธิ์แล้ว"
    : application.admissionResult || "อยู่ระหว่างดำเนินการ";

  const selectedClass = application.selected
    ? "is-selected"
    : "";

  const selectedLabel = application.selected
    ? `
      <span class="selection-badge">
        <span class="selection-check" aria-hidden="true">✓</span>
        ยืนยันสิทธิ์แล้ว
      </span>
    `
    : "";

  return `
    <article
      class="application-card application-card-clickable ${selectedClass}"
      data-detail-id="${escapeHtml(application.id)}"
      tabindex="0"
      role="button"
      aria-label="ดูรายละเอียด ${escapeHtml(application.university)}"
    >
      <div class="card-selection-indicator" aria-hidden="true"></div>

      <div class="card-main">
        <div class="card-identity">
          <div class="card-meta">
            <span class="card-number">
              รายการที่ ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="status ${statusClassMap[application.status] || "status-pending"}">
              ${escapeHtml(application.statusLabel)}
            </span>

            ${selectedLabel}
          </div>

          <h3 class="card-university">
            ${escapeHtml(application.university)}
          </h3>

          <p class="card-program">
            ${escapeHtml(application.faculty)}
            ·
            ${escapeHtml(application.program)}
          </p>

          <p class="card-location">
            ${escapeHtml(application.project)}
            ${
              application.campus
                ? ` · ${escapeHtml(application.campus)}`
                : ""
            }
          </p>
        </div>

        <div class="card-action">
          <p class="card-result">
            ผลการสมัคร
            <strong>${escapeHtml(resultText)}</strong>
          </p>

          <span class="card-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </article>
  `;
}

function attachCardEvents() {
  document
    .querySelectorAll(".application-card-clickable")
    .forEach((card) => {
      const openCardDetails = () => {
        openDetails(card.dataset.detailId);
      };

      card.addEventListener("click", openCardDetails);

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCardDetails();
        }
      });
    });
}

function renderApplications() {
  const visibleApplications = getVisibleApplications();

  elements.applicationList.innerHTML = visibleApplications
    .map((application) => {
      const originalIndex = applications.findIndex(
        (item) => item.id === application.id
      );

      return renderApplicationCard(application, originalIndex);
    })
    .join("");

  elements.emptyState.hidden = visibleApplications.length > 0;

  attachCardEvents();
}

function renderFact(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="fact">
      <span class="fact-label">${escapeHtml(label)}</span>
      <span class="fact-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function renderFileGroup(title, files = []) {
  if (!files.length) {
    return "";
  }

  return `
    <div class="file-group">
      <div class="file-group-title">${escapeHtml(title)}</div>

      <div class="file-list">
        ${files
          .map(
            (file) => `
              <a
                class="file-link"
                href="${escapeHtml(file.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>${escapeHtml(file.title)}</span>
                <span class="file-type">${escapeHtml(file.type)}</span>
              </a>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderInterview(interview) {
  if (!interview || !interview.enabled) {
    return `
      <section class="detail-section">
        <h3>บทสัมภาษณ์</h3>
        <p>ไม่มีข้อมูลการสัมภาษณ์สำหรับรายการนี้</p>
      </section>
    `;
  }

  return `
    <section class="detail-section">
      <h3>บทสัมภาษณ์</h3>

      ${
        interview.note
          ? `
            <div class="interview-note">
              ${escapeHtml(interview.note)}
            </div>
          `
          : ""
      }

      <div class="qa-list">
        ${interview.questions
          .map(
            (question) => `
              <div class="qa-item">
                <p class="qa-scope">
                  ขอบเขตคำถาม: ${escapeHtml(question.scope)}
                </p>

                <p class="qa-answer">
                  ${escapeHtml(question.answer)}
                </p>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function openDetails(applicationId) {
  const application = applications.find(
    (item) => item.id === applicationId
  );

  if (!application) {
    return;
  }

  elements.dialogTitle.textContent = application.university;

  const selectionReasonSection = application.selected
    ? `
      <section class="detail-section">
        <h3>เหตุผลที่เลือกเรียนต่อที่นี่</h3>
        <p>${escapeHtml(application.selectionReason)}</p>
      </section>
    `
    : "";

  const files = application.files || {
    announcements: [],
    portfolio: [],
    additional: []
  };

  const hasFiles =
    files.announcements.length > 0 ||
    files.portfolio.length > 0 ||
    files.additional.length > 0;

  elements.dialogBody.innerHTML = `
    <section class="detail-section">
      <div class="detail-facts">
        ${renderFact("คณะ", application.faculty)}
        ${renderFact("สาขาวิชา", application.program)}
        ${renderFact("โครงการ", application.project)}
        ${renderFact("วิทยาเขต", application.campus)}
        ${renderFact("รอบรับสมัคร", application.applicationRound)}
        ${renderFact("วันที่ประกาศผล", application.resultDate)}
        ${renderFact("สถานะสัมภาษณ์", application.interviewResult)}
        ${renderFact("ผลการสมัคร", application.admissionResult)}
      </div>
    </section>

    <section class="detail-section">
      <h3>จุดเด่นสำคัญที่ทำให้เป็นหนึ่งในตัวเลือก</h3>
      <p>${escapeHtml(application.keyHighlight)}</p>
    </section>

    ${selectionReasonSection}

    <section class="detail-section">
      <h3>ไฟล์และเอกสาร</h3>

      ${renderFileGroup("ประกาศจากมหาวิทยาลัย", files.announcements)}
      ${renderFileGroup("Portfolio", files.portfolio)}
      ${renderFileGroup("เอกสารหรือลิงก์เพิ่มเติม", files.additional)}

      ${
        !hasFiles
          ? "<p>ยังไม่มีไฟล์หรือเอกสารที่แนบไว้</p>"
          : ""
      }
    </section>

    ${renderInterview(application.interview)}
  `;

  elements.dialog.showModal();
}

function initialize() {
  elements.lastUpdated.textContent = archiveConfig.lastUpdated;

  renderStats();
  renderApplications();

  elements.searchInput.addEventListener("input", renderApplications);
  elements.statusFilter.addEventListener("change", renderApplications);

  elements.closeDialog.addEventListener("click", () => {
    elements.dialog.close();
  });

  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
      elements.dialog.close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.dialog.open) {
      elements.dialog.close();
    }
  });
}

initialize();