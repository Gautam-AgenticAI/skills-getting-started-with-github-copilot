// ...existing code...
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (render as DOM so we can attach handlers)
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const scheduleP = document.createElement("p");
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${escapeHtml(details.schedule)}`;

        const availP = document.createElement("p");
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        // Participants container
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("strong");
        participantsTitle.textContent = "Participants:";
        participantsDiv.appendChild(participantsTitle);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.className = "delete-participant";
            btn.type = "button";
            btn.title = `Unregister ${p}`;
            btn.setAttribute("data-activity", name);
            btn.setAttribute("data-email", p);
            btn.innerHTML = "&times;";

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const no = document.createElement("p");
          no.className = "no-participants";
          no.innerHTML = "<em>No participants yet</em>";
          participantsDiv.appendChild(no);
        }

        // Assemble card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(scheduleP);
        activityCard.appendChild(availP);
        activityCard.appendChild(participantsDiv);

        // Attach delete handlers
        participantsDiv.querySelectorAll(".delete-participant").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const email = btn.getAttribute("data-email");
            const activity = btn.getAttribute("data-activity");
            const confirmRemove = confirm(`Remove ${email} from ${activity}?`);
            if (!confirmRemove) return;

            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const result = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                // Refresh activities list and wait for it to finish
                await fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }

              setTimeout(() => messageDiv.classList.add("hidden"), 4000);
            } catch (err) {
              console.error("Error removing participant:", err);
              messageDiv.textContent = "Failed to remove participant. Try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Simple HTML escaping to avoid rendering issues
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

        if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
          // refresh activities to show the new participant
          await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
// ...existing code...