<template>
  <div class="container py-4">
    <h1 class="h2 text-center mb-3">Results</h1>

    <p v-if="status === 'loading'" role="status">Loading screening results…</p>

    <div v-else-if="status === 'error'" class="alert alert-danger" role="alert">
      <p class="mb-2">{{ errorMessage }}</p>
      <button
        type="button"
        class="btn btn-outline-danger btn-sm"
        @click="fetchResults"
      >
        Try again
      </button>
    </div>

    <p v-else-if="!rows.length" role="status">No one has been screened yet.</p>

    <div v-else class="table-responsive">
      <table class="table table-bordered table-striped">
        <caption class="visually-hidden">
          Screened participants
        </caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">First name</th>
            <th scope="col">Date of birth</th>
            <th scope="col">Frequency</th>
            <th scope="col">Daily frequency</th>
            <th scope="col">Cohort</th>
            <th scope="col">Eligibility confirmation</th>
            <th scope="col">Created</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.firstName }}</td>
            <td>{{ row.dateOfBirth }}</td>
            <td>{{ row.frequency }}</td>
            <td>{{ row.dailyFrequency }}</td>
            <td>{{ row.cohort }}</td>
            <td>{{ row.eligibilityConfirmation }}</td>
            <td>{{ row.createdAt }}</td>
            <td>{{ row.updatedAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ApiError, listSubjects } from "@/api/subjects";
import { DAILY_FREQUENCIES, FREQUENCIES, labelFor } from "@/screening";

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTimestamp(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? dateTime.format(date) : "—";
}

function toRow(subject) {
  const a = subject.attributes ?? {};
  return {
    id: subject.id,
    firstName: a.first_name ?? "—",
    dateOfBirth: a.date_of_birth ?? "—",
    frequency: labelFor(FREQUENCIES, a.frequency) ?? "—",
    dailyFrequency: labelFor(DAILY_FREQUENCIES, a.daily_frequency) ?? "—",
    cohort: a.cohort ?? "—",
    eligibilityConfirmation: a.eligibility_confirmation ?? "—",
    // The API uses snake_case for every attribute; the old template read
    // createdAt/updatedAt and printed nothing.
    createdAt: formatTimestamp(a.created_at),
    updatedAt: formatTimestamp(a.updated_at),
  };
}

export default {
  data() {
    return {
      subjects: [],
      status: "loading",
      errorMessage: null,
    };
  },
  computed: {
    rows() {
      return this.subjects.map(toRow);
    },
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      this.status = "loading";
      this.errorMessage = null;
      try {
        this.subjects = await listSubjects();
        this.status = "ready";
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        this.errorMessage = error.message;
        this.status = "error";
      }
    },
  },
};
</script>
