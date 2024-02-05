import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import App from "@/App.vue";
import { createAppRouter } from "@/router";
import { createSubject, listSubjects } from "@/api/subjects";

vi.mock("@/api/subjects", async (importOriginal) => ({
  ...(await importOriginal()),
  createSubject: vi.fn(),
  listSubjects: vi.fn(),
}));

const ben = {
  id: "12",
  attributes: {
    first_name: "Ben",
    eligibility_confirmation: "Participant Ben is assigned to Cohort C",
  },
};

async function mountAt(path) {
  const router = createAppRouter(createMemoryHistory());
  router.push(path);
  await router.isReady();
  const wrapper = mount(App, {
    global: { plugins: [router] },
    attachTo: document.body,
  });
  await flushPromises();
  return { wrapper, router };
}

beforeEach(() => {
  createSubject.mockReset();
  listSubjects.mockReset();
  document.body.innerHTML = "";
});

describe("routing", () => {
  it("redirects unknown paths to the form", async () => {
    const { router, wrapper } = await mountAt("/nope");
    expect(router.currentRoute.value.name).toBe("screeningForm");
    expect(wrapper.find("form").exists()).toBe(true);
  });

  it("moves to the results with the new id after a successful submit", async () => {
    createSubject.mockResolvedValue(ben);
    listSubjects.mockResolvedValue([ben]);
    const { router, wrapper } = await mountAt("/");

    await wrapper.find("#first_name").setValue("Ben");
    await wrapper.find("#date_of_birth").setValue("1988-02-03");
    await wrapper.find("#frequency").setValue(2);
    await wrapper.find("form").trigger("submit");
    // The results route is lazy-loaded, so navigation settles after an import.
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe("/results?submitted=12"),
    );
    await vi.waitFor(() =>
      expect(wrapper.find(".alert-success").exists()).toBe(true),
    );
    expect(wrapper.find(".alert-success").text()).toBe(
      "Participant Ben is assigned to Cohort C",
    );
    expect(wrapper.find("tr.table-success").text()).toContain(
      "your submission",
    );
  });

  it("rebuilds the confirmation from the URL alone, as after a refresh", async () => {
    listSubjects.mockResolvedValue([ben]);
    const { wrapper } = await mountAt("/results?submitted=12");
    expect(wrapper.find(".alert-success").text()).toMatch(/Cohort C/);
  });

  it("says so when the submitted id is not in the list", async () => {
    listSubjects.mockResolvedValue([ben]);
    const { wrapper } = await mountAt("/results?submitted=99");
    expect(wrapper.find(".alert-warning").text()).toBe(
      "Submission 99 is not in the results.",
    );
    expect(wrapper.find("tr.table-success").exists()).toBe(false);
  });

  it("rejects a malformed submitted id without highlighting anything", async () => {
    listSubjects.mockResolvedValue([ben]);
    const { wrapper } = await mountAt("/results?submitted=%3Cimg%20src%3Dx%3E");
    expect(wrapper.find(".alert-warning").text()).toMatch(
      /invalid submission id/,
    );
    expect(wrapper.html()).not.toContain("<img");
  });

  it("shows no notice on a plain results visit", async () => {
    listSubjects.mockResolvedValue([ben]);
    const { wrapper } = await mountAt("/results");
    expect(wrapper.find(".alert").exists()).toBe(false);
  });
});
