<template>
  <div class="container screening-layout">
    <section class="screening-intro" aria-labelledby="screening-title">
      <p class="eyebrow">Participant screening</p>
      <h1 id="screening-title">Can you join the migraine study?</h1>
      <p class="lead-text">
        Three questions decide whether you can take part. Your answers go to the
        study team, who assign eligible people to a cohort.
      </p>
      <ol class="screening-steps">
        <li>Your first name</li>
        <li>Your date of birth: you must be {{ minimumAge }} or older</li>
        <li>How often you get migraine headaches</li>
      </ol>
    </section>

    <form class="panel screening-form" novalidate @submit.prevent="submitForm">
      <h2 class="panel-title">Your answers</h2>

      <div
        v-if="errorMessage"
        ref="errorSummary"
        class="alert alert-danger"
        role="alert"
        tabindex="-1"
      >
        {{ errorMessage }}
      </div>

      <div class="mb-3">
        <label for="first_name" class="form-label">First name</label>
        <input
          id="first_name"
          v-model="formData.first_name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.first_name }"
          autocomplete="given-name"
          :maxlength="nameMaxLength"
          required
          :aria-invalid="Boolean(errors.first_name)"
          :aria-describedby="errors.first_name ? 'first_name-error' : null"
        />
        <p
          v-if="errors.first_name"
          id="first_name-error"
          class="invalid-feedback"
        >
          {{ errors.first_name }}
        </p>
      </div>

      <div class="mb-3">
        <label for="date_of_birth" class="form-label">Date of birth</label>
        <input
          id="date_of_birth"
          v-model="formData.date_of_birth"
          type="date"
          class="form-control"
          :class="{ 'is-invalid': errors.date_of_birth || isUnderAge }"
          :max="today"
          autocomplete="bday"
          required
          :aria-invalid="Boolean(errors.date_of_birth) || isUnderAge"
          aria-describedby="date_of_birth-hint"
        />
        <p id="date_of_birth-hint" class="form-text" aria-live="polite">
          <span v-if="errors.date_of_birth" class="text-danger">
            {{ errors.date_of_birth }}
          </span>
          <span v-else-if="isUnderAge" class="text-danger">
            Only people aged {{ minimumAge }} or older are eligible.
          </span>
          <span v-else
            >You must be {{ minimumAge }} or older to take part.</span
          >
        </p>
      </div>

      <div class="mb-3">
        <label for="frequency" class="form-label">
          How often do you get migraine headaches?
        </label>
        <select
          id="frequency"
          v-model.number="formData.frequency"
          class="form-select"
          :class="{ 'is-invalid': errors.frequency }"
          required
          :disabled="!canChooseFrequency"
          :aria-invalid="Boolean(errors.frequency)"
          :aria-describedby="errors.frequency ? 'frequency-error' : null"
        >
          <option :value="null" disabled>Choose one</option>
          <option
            v-for="option in frequencies"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="errors.frequency"
          id="frequency-error"
          class="invalid-feedback"
        >
          {{ errors.frequency }}
        </p>
      </div>

      <div v-if="isDaily" class="mb-3">
        <label for="daily_frequency" class="form-label">
          How many migraines a day?
        </label>
        <select
          id="daily_frequency"
          v-model.number="formData.daily_frequency"
          class="form-select"
          :class="{ 'is-invalid': errors.daily_frequency }"
          required
          :aria-invalid="Boolean(errors.daily_frequency)"
          :aria-describedby="
            errors.daily_frequency ? 'daily_frequency-error' : null
          "
        >
          <option :value="null" disabled>Choose one</option>
          <option
            v-for="option in dailyFrequencies"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="errors.daily_frequency"
          id="daily_frequency-error"
          class="invalid-feedback"
        >
          {{ errors.daily_frequency }}
        </p>
      </div>

      <button
        :disabled="isSubmitting"
        type="submit"
        class="btn btn-primary btn-lg w-100"
      >
        {{ isSubmitting ? "Submitting..." : "Submit" }}
      </button>
    </form>
  </div>
</template>

<script>
import { ApiError, createSubject } from "@/api/subjects";
import {
  DAILY,
  DAILY_FREQUENCIES,
  FREQUENCIES,
  MINIMUM_AGE,
  NAME_MAX_LENGTH,
  isAdult,
  localIsoDate,
  toSubjectAttributes,
  validateScreening,
} from "@/screening";

export default {
  data() {
    return {
      formData: {
        first_name: "",
        date_of_birth: "",
        frequency: null,
        daily_frequency: null,
      },
      errors: {},
      errorMessage: null,
      isSubmitting: false,
      frequencies: FREQUENCIES,
      dailyFrequencies: DAILY_FREQUENCIES,
      minimumAge: MINIMUM_AGE,
      nameMaxLength: NAME_MAX_LENGTH,
      today: localIsoDate(new Date()),
    };
  },
  computed: {
    isUnderAge() {
      return (
        Boolean(this.formData.date_of_birth) &&
        !isAdult(this.formData.date_of_birth)
      );
    },
    canChooseFrequency() {
      return isAdult(this.formData.date_of_birth);
    },
    isDaily() {
      return this.formData.frequency === DAILY;
    },
  },
  watch: {
    isDaily(daily) {
      if (!daily) this.formData.daily_frequency = null;
    },
  },
  methods: {
    async submitForm() {
      this.errorMessage = null;
      this.errors = validateScreening(this.formData);
      if (Object.keys(this.errors).length) {
        this.errorMessage = "Please fix the highlighted fields.";
        await this.$nextTick();
        this.$refs.errorSummary?.focus();
        return;
      }

      this.isSubmitting = true;
      try {
        const subject = await createSubject(toSubjectAttributes(this.formData));
        // Only the id goes in the URL; the results page re-reads the
        // confirmation from the API, so it survives a refresh.
        await this.$router.push({
          name: "results",
          query: subject.id ? { submitted: subject.id } : {},
        });
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        this.errorMessage = error.message;
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.screening-layout {
  display: grid;
  gap: 2rem;
  padding-block: 2.5rem 3rem;
  align-items: start;
}
@media (min-width: 992px) {
  .screening-layout {
    grid-template-columns: 1fr minmax(0, 30rem);
    gap: 4rem;
    padding-block: 4rem;
  }
}
.screening-intro h1 {
  font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem);
  margin-bottom: 1rem;
}
.lead-text {
  font-size: 1.125rem;
  max-width: 34rem;
}
.screening-steps {
  counter-reset: step;
  list-style: none;
  padding: 0;
  margin: 2rem 0 0;
  max-width: 30rem;
}
.screening-steps li {
  counter-increment: step;
  display: flex;
  gap: 0.875rem;
  align-items: baseline;
  padding: 0.75rem 0;
  border-top: 1px solid var(--study-line);
}
.screening-steps li::before {
  content: counter(step);
  font-family: var(--study-serif);
  font-size: 1.25rem;
  color: var(--study-teal);
  min-width: 1.25rem;
}
</style>
