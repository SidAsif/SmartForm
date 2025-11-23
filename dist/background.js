(() => {
  // src/domain/entities/FormField.js
  var FormField = class _FormField {
    /**
     * @param {Object} params
     * @param {number} params.id - Unique identifier within the form
     * @param {string} params.selector - CSS selector to target this field
     * @param {string} params.label - Human-readable label for the field
     * @param {string} params.type - Input type (text, email, tel, textarea, select, etc.)
     * @param {string} [params.placeholder] - Placeholder text if available
     * @param {string} [params.name] - Name attribute
     * @param {string} [params.currentValue] - Current value in the field
     * @param {Array<string>} [params.options] - Options for select/radio fields
     */
    constructor({ id, selector, label, type, placeholder = "", name = "", currentValue = "", options = [] }) {
      this.id = id;
      this.selector = selector;
      this.label = label;
      this.type = type;
      this.placeholder = placeholder;
      this.name = name;
      this.currentValue = currentValue;
      this.options = options;
    }
    /**
     * Get a human-readable description of this field for AI context
     * @returns {string}
     */
    getContextDescription() {
      const parts = [];
      if (this.label)
        parts.push(`Label: "${this.label}"`);
      if (this.placeholder)
        parts.push(`Placeholder: "${this.placeholder}"`);
      if (this.type)
        parts.push(`Type: ${this.type}`);
      if (this.options.length > 0)
        parts.push(`Options: [${this.options.join(", ")}]`);
      return parts.join(" | ");
    }
    /**
     * Check if this field is required based on available metadata
     * @returns {boolean}
     */
    isRequired() {
      const requiredKeywords = ["required", "mandatory", "*"];
      const labelLower = this.label.toLowerCase();
      return requiredKeywords.some((keyword) => labelLower.includes(keyword));
    }
    /**
     * Convert to plain object for serialization
     * @returns {Object}
     */
    toJSON() {
      return {
        id: this.id,
        selector: this.selector,
        label: this.label,
        type: this.type,
        placeholder: this.placeholder,
        name: this.name,
        currentValue: this.currentValue,
        options: this.options
      };
    }
    /**
     * Create FormField from plain object
     * @param {Object} data
     * @returns {FormField}
     */
    static fromJSON(data) {
      return new _FormField(data);
    }
  };

  // src/domain/entities/UserProfile.js
  var UserProfile = class _UserProfile {
    /**
     * @param {Object} params
     * @param {string} [params.id] - Unique profile ID
     * @param {string} [params.profileName] - Name of the profile (e.g., "Work", "Personal")
     * @param {boolean} [params.isActive] - Whether this profile is currently active
     * @param {string} [params.name] - User's full name
     * @param {string} [params.email] - User's email address
     * @param {string} [params.phone] - User's phone number
     * @param {string} [params.address] - User's address
     * @param {string} [params.company] - User's company name
     * @param {string} [params.jobTitle] - User's job title
     * @param {string} [params.bio] - User's bio or description
     * @param {Array} [params.customFields] - Array of custom fields {name, value, type}
     */
    constructor({
      id = null,
      profileName = "Default Profile",
      isActive = false,
      name = "",
      email = "",
      phone = "",
      address = "",
      company = "",
      jobTitle = "",
      bio = "",
      customFields = []
    } = {}) {
      this.id = id || this.generateId();
      this.profileName = profileName;
      this.isActive = isActive;
      this.name = name;
      this.email = email;
      this.phone = phone;
      this.address = address;
      this.company = company;
      this.jobTitle = jobTitle;
      this.bio = bio;
      this.customFields = customFields;
    }
    /**
     * Generate a unique ID for the profile
     * @returns {string}
     */
    generateId() {
      return "profile_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    }
    /**
     * Check if profile has any data
     * @returns {boolean}
     */
    hasData() {
      const hasStandardFields = !!(this.name || this.email || this.phone || this.address || this.company || this.jobTitle || this.bio);
      const hasCustomFields = this.customFields && this.customFields.length > 0;
      return hasStandardFields || hasCustomFields;
    }
    /**
     * Get a custom field value by name
     * @param {string} fieldName
     * @returns {string|null}
     */
    getCustomField(fieldName) {
      const field = this.customFields.find((f) => f.name.toLowerCase() === fieldName.toLowerCase());
      return field ? field.value : null;
    }
    /**
     * Add or update a custom field
     * @param {string} name
     * @param {string} value
     * @param {string} type - 'text', 'number', 'email', 'tel', 'url', etc.
     */
    setCustomField(name, value, type = "text") {
      const existingIndex = this.customFields.findIndex((f) => f.name === name);
      if (existingIndex >= 0) {
        this.customFields[existingIndex] = { name, value, type };
      } else {
        this.customFields.push({ name, value, type });
      }
    }
    /**
     * Remove a custom field
     * @param {string} name
     */
    removeCustomField(name) {
      this.customFields = this.customFields.filter((f) => f.name !== name);
    }
    /**
     * Get profile as a formatted string for AI context
     * @returns {string}
     */
    toContextString() {
      const parts = [];
      if (this.name)
        parts.push(`Name: ${this.name}`);
      if (this.email)
        parts.push(`Email: ${this.email}`);
      if (this.phone)
        parts.push(`Phone: ${this.phone}`);
      if (this.address)
        parts.push(`Address: ${this.address}`);
      if (this.company)
        parts.push(`Company: ${this.company}`);
      if (this.jobTitle)
        parts.push(`Job Title: ${this.jobTitle}`);
      if (this.bio)
        parts.push(`Bio: ${this.bio}`);
      this.customFields.forEach((field) => {
        if (field.value) {
          parts.push(`${field.name}: ${field.value}`);
        }
      });
      return parts.join("\n");
    }
    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toJSON() {
      return {
        id: this.id,
        profileName: this.profileName,
        isActive: this.isActive,
        name: this.name,
        email: this.email,
        phone: this.phone,
        address: this.address,
        company: this.company,
        jobTitle: this.jobTitle,
        bio: this.bio,
        customFields: this.customFields
      };
    }
    /**
     * Create UserProfile from plain object
     * @param {Object} data
     * @returns {UserProfile}
     */
    static fromJSON(data) {
      return new _UserProfile(data || {});
    }
    /**
     * Create an empty profile
     * @returns {UserProfile}
     */
    static empty() {
      return new _UserProfile();
    }
  };

  // src/infrastructure/chrome/StorageService.js
  var StorageService = class {
    /**
     * Get all profiles from storage
     * @returns {Promise<Array<UserProfile>>}
     */
    static async getAllProfiles() {
      try {
        const result = await chrome.storage.local.get("profiles");
        if (result.profiles && Array.isArray(result.profiles)) {
          return result.profiles.map((p) => UserProfile.fromJSON(p));
        }
        return [];
      } catch (error) {
        console.error("Error getting profiles:", error);
        return [];
      }
    }
    /**
     * Get active user profile from storage
     * @returns {Promise<UserProfile>}
     */
    static async getUserProfile() {
      try {
        const profiles = await this.getAllProfiles();
        const activeProfile = profiles.find((p) => p.isActive);
        if (activeProfile) {
          return activeProfile;
        }
        return profiles.length > 0 ? profiles[0] : UserProfile.empty();
      } catch (error) {
        console.error("Error getting user profile:", error);
        return UserProfile.empty();
      }
    }
    /**
     * Save all profiles to storage
     * @param {Array<UserProfile>} profiles
     * @returns {Promise<void>}
     */
    static async saveAllProfiles(profiles) {
      try {
        await chrome.storage.local.set({
          profiles: profiles.map((p) => p.toJSON())
        });
      } catch (error) {
        console.error("Error saving profiles:", error);
        throw error;
      }
    }
    /**
     * Save a single profile (add or update)
     * @param {UserProfile} profile
     * @returns {Promise<void>}
     */
    static async saveUserProfile(profile) {
      try {
        const profiles = await this.getAllProfiles();
        const existingIndex = profiles.findIndex((p) => p.id === profile.id);
        if (existingIndex >= 0) {
          profiles[existingIndex] = profile;
        } else {
          profiles.push(profile);
        }
        await this.saveAllProfiles(profiles);
      } catch (error) {
        console.error("Error saving user profile:", error);
        throw error;
      }
    }
    /**
     * Delete a profile by ID
     * @param {string} profileId
     * @returns {Promise<void>}
     */
    static async deleteProfile(profileId) {
      try {
        const profiles = await this.getAllProfiles();
        const filtered = profiles.filter((p) => p.id !== profileId);
        await this.saveAllProfiles(filtered);
      } catch (error) {
        console.error("Error deleting profile:", error);
        throw error;
      }
    }
    /**
     * Set active profile by ID
     * @param {string} profileId
     * @returns {Promise<void>}
     */
    static async setActiveProfile(profileId) {
      try {
        const profiles = await this.getAllProfiles();
        profiles.forEach((p) => {
          p.isActive = p.id === profileId;
        });
        await this.saveAllProfiles(profiles);
      } catch (error) {
        console.error("Error setting active profile:", error);
        throw error;
      }
    }
    /**
     * Get OpenAI API key from storage
     * @returns {Promise<string>}
     */
    static async getApiKey() {
      try {
        const result = await chrome.storage.local.get("settings");
        if (result.settings && result.settings.apiKey) {
          return result.settings.apiKey;
        }
        return "";
      } catch (error) {
        console.error("Error getting API key:", error);
        return "";
      }
    }
    /**
     * Save OpenAI API key to storage
     * @param {string} apiKey
     * @returns {Promise<void>}
     */
    static async saveApiKey(apiKey) {
      try {
        const result = await chrome.storage.local.get("settings");
        const settings = result.settings || {};
        settings.apiKey = apiKey;
        await chrome.storage.local.set({ settings });
      } catch (error) {
        console.error("Error saving API key:", error);
        throw error;
      }
    }
    /**
     * Get all settings
     * @returns {Promise<Object>}
     */
    static async getSettings() {
      try {
        const result = await chrome.storage.local.get("settings");
        return result.settings || {};
      } catch (error) {
        console.error("Error getting settings:", error);
        return {};
      }
    }
    /**
     * Save settings
     * @param {Object} settings
     * @returns {Promise<void>}
     */
    static async saveSettings(settings) {
      try {
        await chrome.storage.local.set({ settings });
      } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
      }
    }
    /**
     * Clear all storage
     * @returns {Promise<void>}
     */
    static async clearAll() {
      try {
        await chrome.storage.local.clear();
      } catch (error) {
        console.error("Error clearing storage:", error);
        throw error;
      }
    }
  };

  // src/infrastructure/generators/RandomDataGenerator.js
  var RandomDataGenerator = class {
    /**
     * Generate value based on field type and label
     * @param {Object} field - FormField entity
     * @returns {string}
     */
    static generate(field) {
      const label = field.label.toLowerCase();
      const name = field.name.toLowerCase();
      const type = field.type;
      const placeholder = (field.placeholder || "").toLowerCase();
      const combined = `${label} ${name} ${placeholder}`;
      if (this.matches(combined, ["age", "age range", "age group", "how old"])) {
        if ((type === "select" || type === "radio") && field.options && field.options.length > 0) {
          return this.randomOption(field.options);
        }
        if (type === "number") {
          return String(this.randomInt(18, 65));
        }
        return this.randomAgeRange();
      }
      if (this.matches(combined, ["gender", "sex", "identify as"])) {
        if ((type === "select" || type === "radio") && field.options && field.options.length > 0) {
          return this.randomOption(field.options);
        }
        return this.randomGender();
      }
      if (this.matches(combined, ["where do you live", "city", "location", "region", "town"])) {
        return this.randomCity();
      }
      if (this.matches(combined, ["rating", "rate", "stars", "score"])) {
        if (type === "number" || type === "range") {
          const max = field.max || 5;
          return String(this.randomInt(Math.max(3, max - 2), max));
        }
        if ((type === "select" || type === "radio") && field.options && field.options.length > 0) {
          return this.randomOption(field.options);
        }
        return this.randomRating();
      }
      if (this.matches(combined, ["nps", "net promoter", "recommend", "likely to recommend"])) {
        return String(this.randomInt(7, 10));
      }
      if (this.matches(combined, ["satisfaction", "satisfied", "happy", "pleased"])) {
        return this.randomSatisfaction();
      }
      if (this.matches(combined, ["yes/no", "yes or no", "agree", "disagree"])) {
        return this.randomYesNo();
      }
      if (this.matches(combined, ["strongly", "likert", "agreement", "extent"])) {
        return this.randomLikertScale();
      }
      if (this.matches(combined, ["frequency", "how often", "often do you"])) {
        return this.randomFrequency();
      }
      if (this.matches(combined, ["feedback", "comment", "suggestion", "thoughts", "opinion", "improve", "tell us", "share", "experience", "additional", "anything else"])) {
        if (type === "textarea" || this.matches(combined, ["long", "detailed", "explain", "describe"])) {
          return this.randomFeedback();
        }
        return this.randomShortFeedback();
      }
      if (this.matches(combined, ["reason", "purpose", "why", "what brought"])) {
        return this.randomReason();
      }
      if (this.matches(combined, ["hear about", "find us", "learn about", "discover"])) {
        return this.randomSource();
      }
      if (type === "range") {
        const min = parseInt(field.min) || 0;
        const max = parseInt(field.max) || 100;
        const rangeSize = max - min;
        const lower = min + Math.floor(rangeSize * 0.6);
        const upper = min + Math.floor(rangeSize * 0.9);
        return String(this.randomInt(lower, upper));
      }
      if (this.matches(combined, ["email", "e-mail", "mail"]) || type === "email") {
        return this.randomEmail();
      }
      if (this.matches(combined, ["phone", "mobile", "tel", "cell", "contact number"]) || type === "tel") {
        return this.randomPhone();
      }
      if (this.matches(combined, ["first name", "firstname", "fname", "given name"])) {
        return this.randomFirstName();
      }
      if (this.matches(combined, ["middle name", "middlename", "mname"])) {
        return this.randomMiddleName();
      }
      if (this.matches(combined, ["last name", "lastname", "lname", "surname", "family name"])) {
        return this.randomLastName();
      }
      if (this.matches(combined, ["name", "full name", "fullname", "your name"]) && !this.matches(combined, ["company", "organization", "user"])) {
        return this.randomFullName();
      }
      if (this.matches(combined, ["username", "user name", "login", "handle"])) {
        return this.randomUsername();
      }
      if (this.matches(combined, ["address", "street", "address line 1", "address1"])) {
        return this.randomAddress();
      }
      if (this.matches(combined, ["address line 2", "address2", "apt", "apartment", "suite", "unit"])) {
        return this.randomApartment();
      }
      if (this.matches(combined, ["city", "town"]) && !this.matches(combined, ["where do you live", "location", "region"])) {
        return this.randomCity();
      }
      if (this.matches(combined, ["state", "province"]) && !this.matches(combined, ["where do you live", "location"])) {
        return this.randomState();
      }
      if (this.matches(combined, ["zip", "postal", "postcode", "zip code", "postal code"])) {
        return this.randomZip();
      }
      if (this.matches(combined, ["country", "nation"])) {
        return this.randomCountry();
      }
      if (this.matches(combined, ["company", "organization", "employer", "business", "firm"])) {
        return this.randomCompany();
      }
      if (this.matches(combined, ["job", "title", "position", "occupation", "role", "designation"])) {
        return this.randomJobTitle();
      }
      if (this.matches(combined, ["department", "dept"])) {
        return this.randomDepartment();
      }
      if (this.matches(combined, ["gstin", "gst", "tax", "gst number", "gstin number"])) {
        return this.randomGSTIN();
      }
      if (this.matches(combined, ["pan", "pan number", "pan card"])) {
        return this.randomPAN();
      }
      if (this.matches(combined, ["website", "site", "homepage"]) || type === "url" && !this.matches(combined, ["linkedin", "twitter", "facebook"])) {
        return this.randomWebsite();
      }
      if (this.matches(combined, ["linkedin", "linked in"])) {
        return this.randomLinkedIn();
      }
      if (this.matches(combined, ["twitter"])) {
        return this.randomTwitter();
      }
      if (this.matches(combined, ["github"])) {
        return this.randomGitHub();
      }
      if (this.matches(combined, ["age"])) {
        return String(this.randomInt(18, 65));
      }
      if (this.matches(combined, ["gender", "sex"])) {
        return this.randomGender();
      }
      if (this.matches(combined, ["birth", "dob", "date of birth", "birthday"]) || type === "date" && this.matches(combined, ["birth", "dob"])) {
        return this.randomBirthDate();
      }
      if (type === "date" && !this.matches(combined, ["birth", "dob"])) {
        return this.randomRecentDate();
      }
      if (type === "time") {
        return this.randomTime();
      }
      if (type === "datetime-local") {
        return this.randomDateTime();
      }
      if (this.matches(combined, ["university", "college", "school", "education"])) {
        return this.randomUniversity();
      }
      if (this.matches(combined, ["degree", "qualification"])) {
        return this.randomDegree();
      }
      if (this.matches(combined, ["major", "field of study", "specialization"])) {
        return this.randomMajor();
      }
      if (this.matches(combined, ["salary", "income", "compensation"])) {
        return this.randomSalary();
      }
      if (this.matches(combined, ["credit card", "card number", "cc"])) {
        return this.randomCreditCard();
      }
      if (this.matches(combined, ["cvv", "cvc", "security code"])) {
        return this.randomCVV();
      }
      if (this.matches(combined, ["ssn", "social security"])) {
        return this.randomSSN();
      }
      if (this.matches(combined, ["message", "comment", "note", "description", "bio", "about", "summary"])) {
        return this.randomText();
      }
      if (this.matches(combined, ["experience", "skills", "expertise"])) {
        return this.randomExperience();
      }
      if (this.matches(combined, ["password", "pwd", "pass"]) && type === "password") {
        return this.randomPassword();
      }
      if (type === "select" && field.options && field.options.length > 0) {
        return this.randomOption(field.options);
      }
      if (type === "checkbox") {
        return this.randomBoolean() ? "true" : "false";
      }
      if (type === "radio") {
        if (field.options && field.options.length > 0) {
          return this.randomOption(field.options);
        }
        return "true";
      }
      if (type === "number") {
        if (this.matches(combined, ["age"]))
          return String(this.randomInt(18, 65));
        if (this.matches(combined, ["year", "yyyy"]))
          return String(this.randomInt(1950, 2025));
        if (this.matches(combined, ["month", "mm"]))
          return String(this.randomInt(1, 12));
        if (this.matches(combined, ["day", "dd"]))
          return String(this.randomInt(1, 28));
        if (this.matches(combined, ["quantity", "qty", "amount"]))
          return String(this.randomInt(1, 10));
        if (this.matches(combined, ["price", "cost"]))
          return String(this.randomInt(10, 1e3));
        return String(this.randomInt(1, 100));
      }
      return this.randomText();
    }
    /**
     * Check if text matches any of the keywords
     */
    static matches(text, keywords) {
      return keywords.some((keyword) => text.includes(keyword));
    }
    // ==================== Generator Methods ====================
    static randomEmail() {
      const firstNames = ["john", "jane", "michael", "sarah", "david", "emily", "robert", "lisa", "james", "maria"];
      const lastNames = ["smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis", "wilson", "moore"];
      const domains = ["example.com", "test.com", "demo.com", "sample.com", "mail.com"];
      const firstName = this.pick(firstNames);
      const lastName = this.pick(lastNames);
      const domain = this.pick(domains);
      const separator = this.pick([".", "_", ""]);
      const number = this.randomBoolean() ? this.randomInt(1, 99) : "";
      return `${firstName}${separator}${lastName}${number}@${domain}`;
    }
    static randomPhone() {
      return this.randomDigits(10);
    }
    static randomFirstName() {
      const names = [
        "John",
        "Jane",
        "Michael",
        "Sarah",
        "David",
        "Emily",
        "Robert",
        "Lisa",
        "William",
        "Jennifer",
        "James",
        "Mary",
        "Christopher",
        "Patricia",
        "Daniel",
        "Jessica",
        "Matthew",
        "Ashley"
      ];
      return this.pick(names);
    }
    static randomMiddleName() {
      const names = ["Lee", "Marie", "Ann", "Ray", "Lynn", "James", "Rose", "Grace"];
      return this.pick(names);
    }
    static randomLastName() {
      const names = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Wilson",
        "Anderson",
        "Taylor",
        "Thomas",
        "Moore",
        "Jackson",
        "Martin",
        "Lee"
      ];
      return this.pick(names);
    }
    static randomFullName() {
      return `${this.randomFirstName()} ${this.randomLastName()}`;
    }
    static randomUsername() {
      const firstNames = ["john", "jane", "mike", "sarah", "david", "emily"];
      const suffixes = ["dev", "tech", "pro", "user", ""];
      const firstName = this.pick(firstNames);
      const suffix = this.pick(suffixes);
      const number = this.randomInt(100, 999);
      return suffix ? `${firstName}_${suffix}${number}` : `${firstName}${number}`;
    }
    static randomAddress() {
      const numbers = this.randomInt(100, 9999);
      const streets = ["Main St", "Oak Ave", "Maple Dr", "Park Ln", "Elm St", "Cedar Rd", "Washington Blvd", "Lake View Dr", "Hill St", "River Rd"];
      return `${numbers} ${this.pick(streets)}`;
    }
    static randomApartment() {
      const types = ["Apt", "Suite", "Unit", "#"];
      const type = this.pick(types);
      const number = this.randomInt(1, 500);
      return Math.random() > 0.3 ? `${type} ${number}` : "";
    }
    static randomCity() {
      const cities = [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "Austin",
        "San Jose",
        "Seattle",
        "Denver",
        "Boston",
        "Portland"
      ];
      return this.pick(cities);
    }
    static randomState() {
      const states = [
        "California",
        "Texas",
        "Florida",
        "New York",
        "Pennsylvania",
        "Illinois",
        "Ohio",
        "Georgia",
        "Michigan",
        "North Carolina",
        "Washington",
        "Arizona",
        "Massachusetts",
        "Tennessee",
        "Indiana"
      ];
      return this.pick(states);
    }
    static randomZip() {
      return this.randomDigits(5);
    }
    static randomCountry() {
      const countries = [
        "United States",
        "Canada",
        "United Kingdom",
        "Australia",
        "Germany",
        "France",
        "Italy",
        "Spain",
        "Netherlands",
        "Sweden"
      ];
      return this.pick(countries);
    }
    static randomCompany() {
      const prefixes = ["Global", "Dynamic", "Smart", "Tech", "Digital", "Innovative", "Advanced", "Premier"];
      const suffixes = ["Solutions", "Systems", "Industries", "Corporation", "Group", "Technologies", "Enterprises", "Services"];
      return `${this.pick(prefixes)} ${this.pick(suffixes)}`;
    }
    static randomJobTitle() {
      const titles = [
        "Software Engineer",
        "Product Manager",
        "Data Analyst",
        "UX Designer",
        "Marketing Specialist",
        "Sales Representative",
        "Project Manager",
        "Business Analyst",
        "DevOps Engineer",
        "Content Writer",
        "Customer Success Manager",
        "Accountant",
        "HR Specialist"
      ];
      return this.pick(titles);
    }
    static randomDepartment() {
      const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "Product", "Customer Support"];
      return this.pick(departments);
    }
    static randomWebsite() {
      const names = ["mycompany", "example", "demo", "test", "sample", "mybusiness"];
      const tlds = ["com", "net", "org", "io"];
      return `https://www.${this.pick(names)}.${this.pick(tlds)}`;
    }
    static randomLinkedIn() {
      const username = this.randomUsername();
      return `https://linkedin.com/in/${username}`;
    }
    static randomTwitter() {
      const username = this.randomUsername();
      return `https://twitter.com/${username}`;
    }
    static randomGitHub() {
      const username = this.randomUsername();
      return `https://github.com/${username}`;
    }
    static randomGender() {
      return this.pick(["Male", "Female", "Other", "Prefer not to say"]);
    }
    static randomBirthDate() {
      const year = this.randomInt(1960, 2005);
      const month = String(this.randomInt(1, 12)).padStart(2, "0");
      const day = String(this.randomInt(1, 28)).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    static randomRecentDate() {
      const year = this.randomInt(2022, 2025);
      const month = String(this.randomInt(1, 12)).padStart(2, "0");
      const day = String(this.randomInt(1, 28)).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    static randomTime() {
      const hour = String(this.randomInt(8, 18)).padStart(2, "0");
      const minute = String(this.randomInt(0, 59)).padStart(2, "0");
      return `${hour}:${minute}`;
    }
    static randomDateTime() {
      const date = this.randomRecentDate();
      const time = this.randomTime();
      return `${date}T${time}`;
    }
    static randomUniversity() {
      const universities = [
        "Stanford University",
        "MIT",
        "Harvard University",
        "UC Berkeley",
        "University of Michigan",
        "Cornell University",
        "Yale University",
        "Columbia University",
        "Princeton University",
        "University of Texas"
      ];
      return this.pick(universities);
    }
    static randomDegree() {
      const degrees = [
        "Bachelor of Science",
        "Bachelor of Arts",
        "Master of Science",
        "Master of Business Administration",
        "Master of Arts",
        "PhD"
      ];
      return this.pick(degrees);
    }
    static randomMajor() {
      const majors = [
        "Computer Science",
        "Business Administration",
        "Engineering",
        "Psychology",
        "Economics",
        "Marketing",
        "Finance",
        "Biology"
      ];
      return this.pick(majors);
    }
    static randomSalary() {
      const amounts = [5e4, 6e4, 75e3, 85e3, 1e5, 12e4, 15e4];
      return String(this.pick(amounts));
    }
    static randomCreditCard() {
      return `4532 ${this.randomDigits(4)} ${this.randomDigits(4)} ${this.randomDigits(4)}`;
    }
    static randomCVV() {
      return this.randomDigits(3);
    }
    static randomSSN() {
      return `${this.randomDigits(3)}-${this.randomDigits(2)}-${this.randomDigits(4)}`;
    }
    static randomText() {
      const phrases = [
        "Experienced professional with a proven track record of success.",
        "Passionate about innovation and delivering exceptional results.",
        "Dedicated team player with excellent communication skills.",
        "Results-driven individual with strong analytical abilities.",
        "Creative problem solver with attention to detail.",
        "Committed to continuous learning and professional development."
      ];
      return this.pick(phrases);
    }
    static randomExperience() {
      const experiences = [
        "5+ years of experience in software development and project management.",
        "Proficient in multiple programming languages including Python, JavaScript, and Java.",
        "Strong background in data analysis and business intelligence.",
        "Experienced in leading cross-functional teams and delivering complex projects.",
        "Skilled in modern development practices and agile methodologies."
      ];
      return this.pick(experiences);
    }
    static randomPassword() {
      const words = ["Test", "Demo", "Sample", "Pass"];
      const word = this.pick(words);
      const number = this.randomInt(1e3, 9999);
      const special = this.pick(["!", "@", "#", "$"]);
      return `${word}${number}${special}`;
    }
    static randomOption(options) {
      const validOptions = options.filter((opt) => opt && opt.trim());
      if (validOptions.length === 0)
        return "";
      const firstOption = validOptions[0].toLowerCase();
      if (firstOption.includes("select") || firstOption.includes("choose") || firstOption.includes("--") || firstOption === "" || firstOption.length < 2) {
        return validOptions.length > 1 ? this.pick(validOptions.slice(1)) : validOptions[0];
      }
      return this.pick(validOptions);
    }
    static randomBoolean() {
      return Math.random() > 0.5;
    }
    static randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static randomDigits(length) {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += this.randomInt(0, 9);
      }
      return result;
    }
    static pick(array) {
      return array[Math.floor(Math.random() * array.length)];
    }
    // ==================== Survey & Feedback Methods ====================
    static randomRating() {
      const ratings = ["Excellent", "Great", "Good", "Average", "Fair"];
      const rand = Math.random();
      if (rand < 0.4)
        return "Excellent";
      if (rand < 0.7)
        return "Great";
      if (rand < 0.85)
        return "Good";
      if (rand < 0.95)
        return "Average";
      return "Fair";
    }
    static randomSatisfaction() {
      const levels = [
        "Very Satisfied",
        "Satisfied",
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied"
      ];
      const rand = Math.random();
      if (rand < 0.45)
        return "Very Satisfied";
      if (rand < 0.75)
        return "Satisfied";
      if (rand < 0.9)
        return "Neutral";
      return this.pick(["Dissatisfied", "Very Dissatisfied"]);
    }
    static randomYesNo() {
      return Math.random() < 0.7 ? "Yes" : "No";
    }
    static randomLikertScale() {
      const scales = [
        "Strongly Agree",
        "Agree",
        "Neutral",
        "Disagree",
        "Strongly Disagree"
      ];
      const rand = Math.random();
      if (rand < 0.35)
        return "Strongly Agree";
      if (rand < 0.7)
        return "Agree";
      if (rand < 0.85)
        return "Neutral";
      if (rand < 0.95)
        return "Disagree";
      return "Strongly Disagree";
    }
    static randomFrequency() {
      const frequencies = [
        "Always",
        "Often",
        "Sometimes",
        "Rarely",
        "Never"
      ];
      const rand = Math.random();
      if (rand < 0.15)
        return "Always";
      if (rand < 0.45)
        return "Often";
      if (rand < 0.75)
        return "Sometimes";
      if (rand < 0.92)
        return "Rarely";
      return "Never";
    }
    static randomFeedback() {
      const feedbacks = [
        "Great experience overall! The service was excellent and exceeded my expectations.",
        "Everything went smoothly. Very pleased with the quality and professionalism.",
        "Good service with friendly staff. Would definitely recommend to others.",
        "The product works well and meets my needs. Happy with my purchase.",
        "Overall satisfied with the experience. Minor improvements could be made but nothing major.",
        "Quick and efficient service. Appreciate the attention to detail.",
        "Very responsive team and great communication throughout the process.",
        "The interface is intuitive and easy to use. Makes my work much easier.",
        "Excellent customer support. They resolved my issue promptly.",
        "High quality product and worth the investment. Very satisfied.",
        "The team was helpful and knowledgeable. Great experience from start to finish.",
        "Fast delivery and product was exactly as described. Very happy!",
        "Professional service and attention to customer needs. Will use again.",
        "Everything worked perfectly. No complaints whatsoever.",
        "Impressed with the quality and efficiency. Highly recommend!"
      ];
      return this.pick(feedbacks);
    }
    static randomReason() {
      const reasons = [
        "Looking for information about your products/services",
        "Need assistance with a purchase",
        "General inquiry about your offerings",
        "Interested in learning more about your company",
        "Seeking customer support",
        "Want to provide feedback",
        "Exploring options for a project",
        "Recommended by a friend",
        "Research and comparison shopping",
        "Following up on a previous inquiry"
      ];
      return this.pick(reasons);
    }
    static randomSource() {
      const sources = [
        "Google Search",
        "Friend or Family Recommendation",
        "Social Media (Facebook, Instagram, etc.)",
        "Online Advertisement",
        "Word of Mouth",
        "News Article or Blog",
        "Email Newsletter",
        "YouTube",
        "Review Website",
        "Professional Network (LinkedIn)",
        "Company Website",
        "Trade Show or Event"
      ];
      return this.pick(sources);
    }
    static randomAgeRange() {
      const ranges = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
      const rand = Math.random();
      if (rand < 0.15)
        return "18-24";
      if (rand < 0.4)
        return "25-34";
      if (rand < 0.7)
        return "35-44";
      if (rand < 0.9)
        return "45-54";
      return this.pick(["55-64", "65+"]);
    }
    static randomShortFeedback() {
      const shortFeedbacks = [
        "Great service!",
        "Very satisfied",
        "Excellent experience",
        "Would recommend",
        "Everything was perfect",
        "No complaints",
        "Good quality",
        "Fast and efficient",
        "Very helpful team",
        "Exceeded expectations"
      ];
      return this.pick(shortFeedbacks);
    }
    /**
     * Generate random GSTIN (Goods and Services Tax Identification Number)
     * Format: 22AAAAA0000A1Z5
     * - 2 digits: State code
     * - 10 characters: PAN
     * - 1 digit: Entity number (1-9, A-Z)
     * - 1 character: 'Z' (default)
     * - 1 digit: Checksum
     */
    static randomGSTIN() {
      const stateCode = this.randomDigits(2);
      const pan = this.randomPAN();
      const entityNumber = this.pick(["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"]);
      const checksum = this.randomDigit();
      return `${stateCode}${pan}${entityNumber}Z${checksum}`;
    }
    /**
     * Generate random PAN (Permanent Account Number)
     * Format: AAAAA0000A
     * - 3 letters: First 3 chars (AAA)
     * - 1 letter: Fourth char (P for individual, C for company, etc.)
     * - 1 letter: Fifth char (first letter of surname/name)
     * - 4 digits: Sequential number
     * - 1 letter: Alphabetic check digit
     */
    static randomPAN() {
      const firstThree = this.randomLetters(3).toUpperCase();
      const fourthChar = this.pick(["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"]);
      const fifthChar = this.randomLetter().toUpperCase();
      const digits = this.randomDigits(4);
      const checkDigit = this.randomLetter().toUpperCase();
      return `${firstThree}${fourthChar}${fifthChar}${digits}${checkDigit}`;
    }
    /**
     * Generate random letters
     */
    static randomLetters(count) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < count; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    }
    /**
     * Generate single random letter
     */
    static randomLetter() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return letters.charAt(Math.floor(Math.random() * letters.length));
    }
    /**
     * Generate single random digit
     */
    static randomDigit() {
      return String(Math.floor(Math.random() * 10));
    }
  };

  // src/application/useCases/ProfileFillUseCase.js
  var ProfileFillUseCase = class {
    /**
     * Execute profile fill (no AI needed)
     * @param {Object} params
     * @param {Array} params.fields - Array of field objects
     * @returns {Promise<Object>} Result with fieldValues mapping
     */
    async execute({ fields }) {
      try {
        console.log("ProfileFillUseCase: Starting execution", {
          fieldCount: fields?.length
        });
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
          throw new Error("No fields provided");
        }
        const profile = await StorageService.getUserProfile();
        if (!profile.hasData()) {
          throw new Error("No profile data found. Please configure your profile in settings.");
        }
        console.log("Profile loaded:", {
          hasName: !!profile.name,
          hasEmail: !!profile.email,
          hasPhone: !!profile.phone,
          hasAddress: !!profile.address,
          hasCompany: !!profile.company,
          hasJobTitle: !!profile.jobTitle,
          hasBio: !!profile.bio
        });
        const formFields = fields.map(
          (field) => field instanceof FormField ? field : FormField.fromJSON(field)
        );
        const fieldValues = {};
        for (const field of formFields) {
          if (field.type === "password") {
            continue;
          }
          const value = this.mapFieldToProfile(field, profile);
          if (value) {
            fieldValues[field.selector] = value;
          }
          console.log("Mapped field:", {
            selector: field.selector,
            label: field.label,
            type: field.type,
            value: value || "N/A"
          });
        }
        console.log("ProfileFillUseCase: Mapping complete", {
          totalFields: formFields.length,
          filledFields: Object.keys(fieldValues).length
        });
        return {
          success: true,
          fieldValues
        };
      } catch (error) {
        console.error("ProfileFillUseCase error:", error);
        return {
          success: false,
          fieldValues: {},
          error: error.message
        };
      }
    }
    /**
     * Map a form field to profile data based on label/name matching
     * Falls back to random data if profile data is not available
     * @param {FormField} field
     * @param {UserProfile} profile
     * @returns {string}
     */
    mapFieldToProfile(field, profile) {
      const label = field.label.toLowerCase();
      const name = field.name.toLowerCase();
      const type = field.type;
      const matches = (keywords) => {
        return keywords.some(
          (keyword) => label.includes(keyword) || name.includes(keyword)
        );
      };
      if (profile.customFields && profile.customFields.length > 0) {
        for (const customField of profile.customFields) {
          const customFieldName = customField.name.toLowerCase();
          if (label.includes(customFieldName) || name.includes(customFieldName)) {
            return customField.value;
          }
        }
      }
      if (matches(["email", "e-mail"]) || type === "email") {
        return profile.email || RandomDataGenerator.randomEmail();
      }
      if (matches(["phone", "mobile", "tel", "contact number"]) || type === "tel") {
        return profile.phone || RandomDataGenerator.randomPhone();
      }
      if (matches(["address", "street", "location"])) {
        return profile.address || RandomDataGenerator.randomAddress();
      }
      if (matches(["city", "town"])) {
        return profile.address || RandomDataGenerator.randomCity();
      }
      if (matches(["state", "province"])) {
        return RandomDataGenerator.randomState();
      }
      if (matches(["zip", "postal", "postcode"])) {
        return RandomDataGenerator.randomZip();
      }
      if (matches(["company", "organization", "employer", "business"])) {
        return profile.company || RandomDataGenerator.randomCompany();
      }
      if (matches(["title", "position", "role", "job", "occupation"])) {
        return profile.jobTitle || RandomDataGenerator.randomJobTitle();
      }
      if (matches(["full name", "fullname", "your name"])) {
        return profile.name || RandomDataGenerator.randomFullName();
      }
      if (matches(["first name", "firstname", "fname"])) {
        if (profile.name) {
          const parts = profile.name.split(" ");
          return parts[0];
        }
        return RandomDataGenerator.randomFirstName();
      }
      if (matches(["last name", "lastname", "surname", "lname"])) {
        if (profile.name) {
          const parts = profile.name.split(" ");
          return parts.length > 1 ? parts[parts.length - 1] : RandomDataGenerator.randomLastName();
        }
        return RandomDataGenerator.randomLastName();
      }
      if (matches(["name"]) && !matches(["username", "user name"])) {
        return profile.name || RandomDataGenerator.randomFullName();
      }
      if (matches(["bio", "about", "description", "summary", "profile"])) {
        return profile.bio || RandomDataGenerator.randomText();
      }
      if (field.type === "textarea") {
        return profile.bio || RandomDataGenerator.randomText();
      }
      return RandomDataGenerator.generate(field);
    }
  };

  // src/application/useCases/RandomFillUseCase.js
  var RandomFillUseCase = class {
    /**
     * Execute random fill (no AI needed)
     * @param {Object} params
     * @param {Array} params.fields - Array of field objects
     * @returns {Object} Result with fieldValues mapping
     */
    execute({ fields }) {
      try {
        console.log("RandomFillUseCase: Starting execution", {
          fieldCount: fields?.length
        });
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
          throw new Error("No fields provided");
        }
        const formFields = fields.map(
          (field) => field instanceof FormField ? field : FormField.fromJSON(field)
        );
        const fieldValues = {};
        for (const field of formFields) {
          const value = RandomDataGenerator.generate(field);
          fieldValues[field.selector] = value;
        }
        console.log("RandomFillUseCase: Generation complete", {
          totalFields: formFields.length,
          filledFields: Object.keys(fieldValues).length
        });
        return {
          success: true,
          fieldValues
        };
      } catch (error) {
        console.error("RandomFillUseCase error:", error);
        return {
          success: false,
          fieldValues: {},
          error: error.message
        };
      }
    }
  };

  // src/infrastructure/chrome/background.js
  console.log("SmartForm Auto-Filler background service worker loaded");
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);
    switch (request.action) {
      case "profile_fill":
        handleProfileFill(request, sender, sendResponse);
        return true;
      case "random_fill":
        handleRandomFill(request, sender, sendResponse);
        return false;
      case "content_ready":
        handleContentReady(request, sender);
        return false;
      case "ping":
        sendResponse({ status: "ready" });
        return false;
      default:
        sendResponse({ success: false, error: "Unknown action" });
        return false;
    }
  });
  async function handleProfileFill(request, sender, sendResponse) {
    try {
      const { fields } = request;
      console.log("Profile fill request:", {
        fieldCount: fields?.length
      });
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        throw new Error("No fields provided");
      }
      const useCase = new ProfileFillUseCase();
      const result = await useCase.execute({ fields });
      console.log("Profile fill complete:", {
        success: result.success,
        valueCount: Object.keys(result.fieldValues || {}).length
      });
      sendResponse(result);
    } catch (error) {
      console.error("Error in handleProfileFill:", error);
      sendResponse({
        success: false,
        fieldValues: {},
        error: error.message || "Failed to fill with profile data"
      });
    }
  }
  function handleRandomFill(request, sender, sendResponse) {
    try {
      const { fields } = request;
      console.log("Random fill request:", {
        fieldCount: fields?.length
      });
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        throw new Error("No fields provided");
      }
      const useCase = new RandomFillUseCase();
      const result = useCase.execute({ fields });
      console.log("Random fill complete:", {
        success: result.success,
        valueCount: Object.keys(result.fieldValues || {}).length
      });
      sendResponse(result);
    } catch (error) {
      console.error("Error in handleRandomFill:", error);
      sendResponse({
        success: false,
        fieldValues: {},
        error: error.message || "Failed to generate random fill data"
      });
    }
  }
  function handleContentReady(request, sender) {
    console.log("Content script ready:", {
      tabId: sender.tab?.id,
      url: request.url
    });
  }
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("SmartForm Auto-Filler installed:", details.reason);
    if (details.reason === "install") {
      chrome.storage.local.set({
        profile: {
          name: "",
          email: "",
          phone: "",
          address: "",
          company: "",
          jobTitle: "",
          bio: ""
        }
      });
      console.log("Storage initialized");
    }
  });
})();
