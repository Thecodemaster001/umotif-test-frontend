import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import TheResults from "@/components/TheResults.vue";
import { ApiError, listSubjects } from "@/api/subjects";

vi.mock("@/api/subjects", async (importOriginal) => ({
  ...(await importOriginal()),
  listSubjects: vi.fn(),
}));

const subject = {
  id: "12",
  type: "subjects",
  attributes: {
    first_name: "Ben",
    date_of_birth: "1988-02-03",
    frequency: 3,
    daily_frequency: 2,
    cohort: "C",
    eligibility_confirmation: "Participant Ben is assigned to Cohort C",
    created_at: "2026-11-03T15:40:00Z",
    updated_at: "2026-11-03T15:40:00Z",
  },
};

beforeEach(() => {
  listSubjects.mockReset();
});

describe("TheResults", () => {
  it("announces loading while the request is in flight", () => {
    listSubjects.mockReturnValue(new Promise(() => {}));
    const wrapper = mount(TheResults);
    expect(wrapper.find('[role="status"]').text()).toMatch(/Loading/);
  });

  it("renders one cell per header with the confirmation in its own column", async () => {
    listSubjects.mockResolvedValue([subject]);
    const wrapper = mount(TheResults);
    await flushPromises();

    const headers = wrapper.findAll("thead th").map((th) => th.text());
    const cells = wrapper.findAll("tbody tr td").map((td) => td.text());
    expect(cells).toHaveLength(headers.length);
    const cell = (header) => cells[headers.indexOf(header)];
    expect(cell("First name")).toBe("Ben");
    expect(cell("Frequency")).toBe("Daily");
    expect(cell("Daily frequency")).toBe("3-4 per day");
    expect(cell("Eligibility confirmation")).toBe(
      "Participant Ben is assigned to Cohort C",
    );
    expect(cell("Created")).not.toBe("—");
  });

  it("shows dashes for missing or malformed attributes", async () => {
    listSubjects.mockResolvedValue([
      { id: "1", attributes: { first_name: "Cleo", created_at: "not a date" } },
    ]);
    const wrapper = mount(TheResults);
    await flushPromises();
    const cells = wrapper.findAll("tbody td").map((td) => td.text());
    expect(cells[1]).toBe("Cleo");
    expect(cells.slice(2)).toEqual(Array(7).fill("—"));
  });

  it("explains an empty list", async () => {
    listSubjects.mockResolvedValue([]);
    const wrapper = mount(TheResults);
    await flushPromises();
    expect(wrapper.find("table").exists()).toBe(false);
    expect(wrapper.text()).toMatch(/No one has been screened yet/);
  });

  it("shows the error and retries on request", async () => {
    listSubjects.mockRejectedValueOnce(new ApiError("API is down", 503));
    const wrapper = mount(TheResults);
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toMatch(/API is down/);

    listSubjects.mockResolvedValueOnce([subject]);
    await wrapper.find('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
  });
});
