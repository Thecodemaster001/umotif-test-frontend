<template>
  <div
    class="d-flex align-items-center justify-content-center"
    style="height: 100vh"
  >
    <form class="w-50" @submit.prevent="submitForm">
      <div v-if="errorMessage" class="mt-4 alert alert-danger">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-if="successMessage" class="mt-2 alert alert-success">
        <p v-if="eligibilityConfirmation">{{ eligibilityConfirmation }}</p>
      </div>

      <h1 class="mb-4">Screening Form For Clinical Trial</h1>

      <div class="mb-3">
        <label for="first_name" class="form-label">First Name:</label>
        <input
          v-model="formData.first_name"
          type="text"
          class="form-control"
          required
        />
      </div>

      <div class="mb-3">
        <label for="date_of_birth" class="form-label">Date of Birth:</label>
        <input
          v-model="formData.date_of_birth"
          type="date"
          class="form-control"
          required
        />
      </div>

      <div class="mb-3">
        <label for="frequency" class="form-label"
          >Frequency of Migraine Headaches:</label
        >
        <select
          v-model="formData.frequency"
          class="form-control"
          required
          :disabled="isFrequencyDisabled"
        >
          <option value="1">Monthly</option>
          <option value="2">Weekly</option>
          <option value="3">Daily</option>
        </select>
        <p v-if="!isEligible" class="text-danger mt-2">
          Only individuals aged 18 years or older are eligible.
        </p>
      </div>

      <div v-if="formData.frequency == 3" class="mb-3">
        <label for="daily_frequency" class="form-label"
          >Daily Frequency (if Daily):</label
        >
        <select v-model="formData.daily_frequency" class="form-control">
          <option value="1">1-2</option>
          <option value="2">3-4</option>
          <option value="3">5+</option>
        </select>
      </div>

      <button :disabled="isSubmitting" type="submit" class="btn btn-primary">
        {{ isSubmitting ? "Submitting..." : "Submit" }}
      </button>
    </form>
  </div>
</template>

<script>
import { createSubject } from "@/api/subjects";

export default {
  data() {
    return {
      formData: {
        first_name: "",
        date_of_birth: "",
        frequency: null,
        daily_frequency: null,
      },
      errorMessage: null,
      successMessage: null,
      eligibilityConfirmation: null,
      isSubmitting: false,
    };
  },
  computed: {
    maxEligibleDate() {
      const today = new Date();
      today.setFullYear(today.getFullYear() - 18);
      return today.toISOString().split("T")[0];
    },
    isEligible() {
      if (!this.formData.date_of_birth) return true;
      const birthDate = new Date(this.formData.date_of_birth);
      const maxDate = new Date(this.maxEligibleDate);
      return birthDate <= maxDate;
    },
    isFrequencyDisabled() {
      if (!this.formData.date_of_birth) return true;
      const birthDate = new Date(this.formData.date_of_birth);
      const maxDate = new Date(this.maxEligibleDate);
      return birthDate > maxDate;
    },
  },
  watch: {
    "formData.daily_frequency"(newVal) {
      this.formData.daily_frequency = parseInt(newVal);
    },
    "formData.frequency"(newVal) {
      this.formData.frequency = parseInt(newVal);
    },
  },
  methods: {
    submitForm() {
      this.isSubmitting = true;
      this.errorMessage = null;
      this.successMessage = null;
      const attributes = Object.entries(this.formData).reduce(
        (a, [k, v]) => (v !== "" && v !== null ? ((a[k] = v), a) : a),
        {},
      );
      createSubject(attributes)
        .then((subject) => {
          this.successMessage = true;
          this.eligibilityConfirmation =
            subject.attributes.eligibility_confirmation;
        })
        .catch((error) => {
          this.errorMessage = error.message;
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    },
  },
};
</script>
