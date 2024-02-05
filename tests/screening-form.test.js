import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import TheScreeningForm from "@/components/TheScreeningForm.vue";
import { ApiError, createSubject } from "@/api/subjects";

vi.mock("@/api/subjects", async (importOriginal) => ({
  ...(await importOriginal()),
  createSubject: vi.fn(),
}));

function mountForm() {
  return mount(TheScreeningForm, { attachTo: document.body });
}

async function fillAdult(wrapper, { frequency = 2, daily } = {}) {
  await wrapper.find("#first_name").setValue("Ada");
  await wrapper.find("#date_of_birth").setValue("1990-05-01");
  await wrapper.find("#frequency").setValue(frequency);
  if (daily) await wrapper.find("#daily_frequency").setValue(daily);
}

beforeEach(() => {
  createSubject.mockReset();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("TheScreeningForm", () => {
  it("labels every control", () => {
    const wrapper = mountForm();
    for (const id of ["first_name", "date_of_birth", "frequency"]) {
      expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true);
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    }
  });

  it("keeps frequency disabled until an adult date of birth is entered", async () => {
    const wrapper = mountForm();
    expect(wrapper.find("#frequency").element.disabled).toBe(true);
    await wrapper.find("#date_of_birth").setValue("2015-01-01");
    expect(wrapper.find("#frequency").element.disabled).toBe(true);
    expect(wrapper.find("#date_of_birth-hint").text()).toMatch(/18 or older/);
    await wrapper.find("#date_of_birth").setValue("1990-05-01");
    expect(wrapper.find("#frequency").element.disabled).toBe(false);
  });

  it("shows field errors and focuses the alert instead of submitting an empty form", async () => {
    const wrapper = mountForm();
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createSubject).not.toHaveBeenCalled();
    const alert = wrapper.find('[role="alert"]');
    expect(alert.text()).toMatch(/fix the highlighted fields/);
    expect(document.activeElement).toBe(alert.element);
    expect(wrapper.find("#first_name").attributes("aria-invalid")).toBe("true");
    expect(wrapper.find("#first_name").attributes("aria-describedby")).toBe(
      "first_name-error",
    );
    expect(wrapper.find("#first_name-error").text()).toBe(
      "Enter a first name.",
    );
  });

  it("only shows the daily count for daily migraines and clears it when switching back", async () => {
    const wrapper = mountForm();
    await fillAdult(wrapper, { frequency: 3, daily: 2 });
    expect(wrapper.find("#daily_frequency").exists()).toBe(true);

    await wrapper.find("#frequency").setValue(2);
    expect(wrapper.find("#daily_frequency").exists()).toBe(false);

    createSubject.mockResolvedValue({ id: "1", attributes: {} });
    await wrapper.find("form").trigger("submit");
    await flushPromises();
    expect(createSubject).toHaveBeenCalledWith({
      first_name: "Ada",
      date_of_birth: "1990-05-01",
      frequency: 2,
    });
  });

  it("posts valid answers and announces the eligibility confirmation", async () => {
    createSubject.mockResolvedValue({
      id: "4",
      attributes: { eligibility_confirmation: "Assigned to Cohort C" },
    });
    const wrapper = mountForm();
    await fillAdult(wrapper, { frequency: 3, daily: 1 });
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createSubject).toHaveBeenCalledWith({
      first_name: "Ada",
      date_of_birth: "1990-05-01",
      frequency: 3,
      daily_frequency: 1,
    });
    expect(wrapper.find('[role="status"]').text()).toBe("Assigned to Cohort C");
  });

  it("shows the API error message when the submission is rejected", async () => {
    createSubject.mockRejectedValue(
      new ApiError("first_name has already been taken", 422),
    );
    const wrapper = mountForm();
    await fillAdult(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toBe(
      "first_name has already been taken",
    );
    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false);
  });
});
