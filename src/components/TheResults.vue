<template>
  <div>
    <h2 class="text-center mt-4 mb-2">Results</h2>
    <table class="table table-bordered table-striped mx-auto">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Date of Birth</th>
          <th>Frequency</th>
          <th>Daily Frequency</th>
          <th>Cohort</th>
          <th>Eligibility Confirmation</th>
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.id">
          <td>{{ result.id }}</td>
          <td>{{ result.attributes.first_name }}</td>
          <td>{{ result.attributes.date_of_birth }}</td>
          <td>{{ result.attributes.frequency }}</td>
          <td>{{ result.attributes.daily_frequency }}</td>
          <td>{{ result.attributes.cohort }}</td>
          <td>{{ result.attributes.createdAt }}</td>
          <td>{{ result.attributes.updatedAt }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { listSubjects } from "@/api/subjects";

export default {
  data() {
    return {
      results: [],
    };
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    fetchResults() {
      listSubjects()
        .then((subjects) => {
          this.results = subjects;
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
};
</script>
