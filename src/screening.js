export const MINIMUM_AGE = 18;
export const NAME_MAX_LENGTH = 100;

export const FREQUENCIES = [
  { value: 1, label: "Monthly" },
  { value: 2, label: "Weekly" },
  { value: 3, label: "Daily" },
];
export const DAILY_FREQUENCIES = [
  { value: 1, label: "1-2 per day" },
  { value: 2, label: "3-4 per day" },
  { value: 3, label: "5 or more per day" },
];
export const DAILY = 3;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Uses the local calendar date. The old code went through toISOString(),
// which is UTC and moved the cut-off by a day for users east or west of UTC.
export function localIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Latest birth date that is MINIMUM_AGE today. Compared as YYYY-MM-DD
// strings, so a 29 February cut-off works without date arithmetic.
export function latestEligibleBirthDate(today = new Date()) {
  return `${today.getFullYear() - MINIMUM_AGE}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function isAdult(dateOfBirth, today = new Date()) {
  return (
    ISO_DATE.test(dateOfBirth) && dateOfBirth <= latestEligibleBirthDate(today)
  );
}

export function labelFor(options, value) {
  return options.find((option) => option.value === Number(value))?.label;
}

export function validateScreening(form, today = new Date()) {
  const errors = {};
  const name = form.first_name.trim();
  if (!name) {
    errors.first_name = "Enter a first name.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.first_name = `Use ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!ISO_DATE.test(form.date_of_birth)) {
    errors.date_of_birth = "Enter a date of birth.";
  } else if (form.date_of_birth > localIsoDate(today)) {
    errors.date_of_birth = "Date of birth can't be in the future.";
  } else if (!isAdult(form.date_of_birth, today)) {
    errors.date_of_birth = `Only people aged ${MINIMUM_AGE} or older are eligible.`;
  }

  if (!labelFor(FREQUENCIES, form.frequency)) {
    errors.frequency = "Choose how often the migraines happen.";
  } else if (
    Number(form.frequency) === DAILY &&
    !labelFor(DAILY_FREQUENCIES, form.daily_frequency)
  ) {
    errors.daily_frequency = "Choose how many migraines a day.";
  }
  return errors;
}

// daily_frequency only means something for daily migraines; the old form
// kept sending a stale value after the user switched back to weekly.
export function toSubjectAttributes(form) {
  const attributes = {
    first_name: form.first_name.trim(),
    date_of_birth: form.date_of_birth,
    frequency: Number(form.frequency),
  };
  if (attributes.frequency === DAILY) {
    attributes.daily_frequency = Number(form.daily_frequency);
  }
  return attributes;
}
