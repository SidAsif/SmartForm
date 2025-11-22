/**
 * RandomDataGenerator
 *
 * Infrastructure utility for generating realistic random data.
 * Used for Random Fill mode (no AI required).
 * Enhanced with better field detection and context-aware generation.
 */
export class RandomDataGenerator {
  /**
   * Generate value based on field type and label
   * @param {Object} field - FormField entity
   * @returns {string}
   */
  static generate(field) {
    const label = field.label.toLowerCase();
    const name = field.name.toLowerCase();
    const type = field.type;
    const placeholder = (field.placeholder || '').toLowerCase();
    const combined = `${label} ${name} ${placeholder}`;

    // ===== SURVEY & FEEDBACK FIELDS (Check these first for accuracy) =====

    // Age range questions (common in surveys)
    if (this.matches(combined, ['age', 'age range', 'age group', 'how old'])) {
      // For select/radio, pick from options if available
      if ((type === 'select' || type === 'radio') && field.options && field.options.length > 0) {
        return this.randomOption(field.options);
      }
      // For text input, return age number
      if (type === 'number') {
        return String(this.randomInt(18, 65));
      }
      // Return age range text
      return this.randomAgeRange();
    }

    // Gender questions
    if (this.matches(combined, ['gender', 'sex', 'identify as'])) {
      // For select/radio, pick from options if available
      if ((type === 'select' || type === 'radio') && field.options && field.options.length > 0) {
        return this.randomOption(field.options);
      }
      return this.randomGender();
    }

    // Location/City questions
    if (this.matches(combined, ['where do you live', 'city', 'location', 'region', 'town'])) {
      return this.randomCity();
    }

    // Rating fields (1-5, 1-10, etc.)
    if (this.matches(combined, ['rating', 'rate', 'stars', 'score'])) {
      if (type === 'number' || type === 'range') {
        // Determine max rating from field or default to 5
        const max = field.max || 5;
        return String(this.randomInt(Math.max(3, max - 2), max)); // Skew towards higher ratings
      }
      // For select/radio, pick from options if available
      if ((type === 'select' || type === 'radio') && field.options && field.options.length > 0) {
        return this.randomOption(field.options);
      }
      return this.randomRating();
    }

    // NPS (Net Promoter Score) - typically 0-10
    if (this.matches(combined, ['nps', 'net promoter', 'recommend', 'likely to recommend'])) {
      return String(this.randomInt(7, 10)); // Skew towards promoters (9-10)
    }

    // Satisfaction fields
    if (this.matches(combined, ['satisfaction', 'satisfied', 'happy', 'pleased'])) {
      return this.randomSatisfaction();
    }

    // Yes/No questions
    if (this.matches(combined, ['yes/no', 'yes or no', 'agree', 'disagree'])) {
      return this.randomYesNo();
    }

    // Likert scale (Strongly Disagree to Strongly Agree)
    if (this.matches(combined, ['strongly', 'likert', 'agreement', 'extent'])) {
      return this.randomLikertScale();
    }

    // Frequency questions (Always, Often, Sometimes, Rarely, Never)
    if (this.matches(combined, ['frequency', 'how often', 'often do you'])) {
      return this.randomFrequency();
    }

    // Feedback, Comments, Suggestions (Natural text responses)
    // Only for textarea or long text inputs to avoid filling short fields
    if (this.matches(combined, ['feedback', 'comment', 'suggestion', 'thoughts', 'opinion', 'improve', 'tell us', 'share', 'experience', 'additional', 'anything else'])) {
      if (type === 'textarea' || this.matches(combined, ['long', 'detailed', 'explain', 'describe'])) {
        return this.randomFeedback();
      }
      // For short text inputs, return shorter response
      return this.randomShortFeedback();
    }

    // Reason for visit/contact
    if (this.matches(combined, ['reason', 'purpose', 'why', 'what brought'])) {
      return this.randomReason();
    }

    // How did you hear about us
    if (this.matches(combined, ['hear about', 'find us', 'learn about', 'discover'])) {
      return this.randomSource();
    }

    // Range inputs (sliders)
    if (type === 'range') {
      const min = parseInt(field.min) || 0;
      const max = parseInt(field.max) || 100;
      // Skew towards upper 60-80% of range
      const rangeSize = max - min;
      const lower = min + Math.floor(rangeSize * 0.6);
      const upper = min + Math.floor(rangeSize * 0.9);
      return String(this.randomInt(lower, upper));
    }

    // ===== STANDARD FIELDS =====

    // Email fields
    if (this.matches(combined, ['email', 'e-mail', 'mail']) || type === 'email') {
      return this.randomEmail();
    }

    // Phone/Mobile fields
    if (this.matches(combined, ['phone', 'mobile', 'tel', 'cell', 'contact number']) || type === 'tel') {
      return this.randomPhone();
    }

    // Name fields (specific to general)
    if (this.matches(combined, ['first name', 'firstname', 'fname', 'given name'])) {
      return this.randomFirstName();
    }

    if (this.matches(combined, ['middle name', 'middlename', 'mname'])) {
      return this.randomMiddleName();
    }

    if (this.matches(combined, ['last name', 'lastname', 'lname', 'surname', 'family name'])) {
      return this.randomLastName();
    }

    if (this.matches(combined, ['name', 'full name', 'fullname', 'your name']) &&
        !this.matches(combined, ['company', 'organization', 'user'])) {
      return this.randomFullName();
    }

    if (this.matches(combined, ['username', 'user name', 'login', 'handle'])) {
      return this.randomUsername();
    }

    // Address fields
    if (this.matches(combined, ['address', 'street', 'address line 1', 'address1'])) {
      return this.randomAddress();
    }

    if (this.matches(combined, ['address line 2', 'address2', 'apt', 'apartment', 'suite', 'unit'])) {
      return this.randomApartment();
    }

    if (this.matches(combined, ['city', 'town']) &&
        !this.matches(combined, ['where do you live', 'location', 'region'])) {
      return this.randomCity();
    }

    if (this.matches(combined, ['state', 'province']) &&
        !this.matches(combined, ['where do you live', 'location'])) {
      return this.randomState();
    }

    if (this.matches(combined, ['zip', 'postal', 'postcode', 'zip code', 'postal code'])) {
      return this.randomZip();
    }

    if (this.matches(combined, ['country', 'nation'])) {
      return this.randomCountry();
    }

    // Organization fields
    if (this.matches(combined, ['company', 'organization', 'employer', 'business', 'firm'])) {
      return this.randomCompany();
    }

    if (this.matches(combined, ['job', 'title', 'position', 'occupation', 'role', 'designation'])) {
      return this.randomJobTitle();
    }

    if (this.matches(combined, ['department', 'dept'])) {
      return this.randomDepartment();
    }

    // Web/Social fields
    if (this.matches(combined, ['website', 'site', 'homepage']) ||
        (type === 'url' && !this.matches(combined, ['linkedin', 'twitter', 'facebook']))) {
      return this.randomWebsite();
    }

    if (this.matches(combined, ['linkedin', 'linked in'])) {
      return this.randomLinkedIn();
    }

    if (this.matches(combined, ['twitter'])) {
      return this.randomTwitter();
    }

    if (this.matches(combined, ['github'])) {
      return this.randomGitHub();
    }

    // Personal info
    if (this.matches(combined, ['age'])) {
      return String(this.randomInt(18, 65));
    }

    if (this.matches(combined, ['gender', 'sex'])) {
      return this.randomGender();
    }

    if (this.matches(combined, ['birth', 'dob', 'date of birth', 'birthday']) ||
        (type === 'date' && this.matches(combined, ['birth', 'dob']))) {
      return this.randomBirthDate();
    }

    if (type === 'date' && !this.matches(combined, ['birth', 'dob'])) {
      return this.randomRecentDate();
    }

    // Handle time inputs
    if (type === 'time') {
      return this.randomTime();
    }

    // Handle datetime-local inputs
    if (type === 'datetime-local') {
      return this.randomDateTime();
    }

    // Education
    if (this.matches(combined, ['university', 'college', 'school', 'education'])) {
      return this.randomUniversity();
    }

    if (this.matches(combined, ['degree', 'qualification'])) {
      return this.randomDegree();
    }

    if (this.matches(combined, ['major', 'field of study', 'specialization'])) {
      return this.randomMajor();
    }

    // Financial
    if (this.matches(combined, ['salary', 'income', 'compensation'])) {
      return this.randomSalary();
    }

    if (this.matches(combined, ['credit card', 'card number', 'cc'])) {
      return this.randomCreditCard();
    }

    if (this.matches(combined, ['cvv', 'cvc', 'security code'])) {
      return this.randomCVV();
    }

    if (this.matches(combined, ['ssn', 'social security'])) {
      return this.randomSSN();
    }

    // Text content
    if (this.matches(combined, ['message', 'comment', 'note', 'description', 'bio', 'about', 'summary'])) {
      return this.randomText();
    }

    if (this.matches(combined, ['experience', 'skills', 'expertise'])) {
      return this.randomExperience();
    }

    if (this.matches(combined, ['password', 'pwd', 'pass']) && type === 'password') {
      return this.randomPassword();
    }

    // Handle select dropdowns
    if (type === 'select' && field.options && field.options.length > 0) {
      return this.randomOption(field.options);
    }

    // Handle checkboxes
    if (type === 'checkbox') {
      return this.randomBoolean() ? 'true' : 'false';
    }

    // Handle radio buttons - pick from options if available
    if (type === 'radio' || type === 'google-forms-radio') {
      console.log('[RandomDataGenerator] Generating value for radio button:', {
        type: type,
        label: field.label,
        name: field.name,
        hasOptions: !!field.options,
        optionsLength: field.options?.length || 0,
        options: field.options
      });

      if (field.options && field.options.length > 0) {
        const selectedOption = this.randomOption(field.options);
        console.log(`[RandomDataGenerator] Selected option: "${selectedOption}" from [${field.options.join(', ')}]`);
        return selectedOption;
      }
      console.warn('[RandomDataGenerator] No options available for radio, using fallback "true"');
      return 'true'; // Fallback: randomly select one
    }

    // Handle number inputs with context
    if (type === 'number') {
      if (this.matches(combined, ['age'])) return String(this.randomInt(18, 65));
      if (this.matches(combined, ['year', 'yyyy'])) return String(this.randomInt(1950, 2025));
      if (this.matches(combined, ['month', 'mm'])) return String(this.randomInt(1, 12));
      if (this.matches(combined, ['day', 'dd'])) return String(this.randomInt(1, 28));
      if (this.matches(combined, ['quantity', 'qty', 'amount'])) return String(this.randomInt(1, 10));
      if (this.matches(combined, ['price', 'cost'])) return String(this.randomInt(10, 1000));
      return String(this.randomInt(1, 100));
    }

    // Default: generate generic text
    return this.randomText();
  }

  /**
   * Check if text matches any of the keywords
   */
  static matches(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  // ==================== Generator Methods ====================

  static randomEmail() {
    const firstNames = ['john', 'jane', 'michael', 'sarah', 'david', 'emily', 'robert', 'lisa', 'james', 'maria'];
    const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'wilson', 'moore'];
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.com', 'mail.com'];

    const firstName = this.pick(firstNames);
    const lastName = this.pick(lastNames);
    const domain = this.pick(domains);
    const separator = this.pick(['.', '_', '']);
    const number = this.randomBoolean() ? this.randomInt(1, 99) : '';

    return `${firstName}${separator}${lastName}${number}@${domain}`;
  }

  static randomPhone() {
    const formats = [
      `+1 (${this.randomDigits(3)}) ${this.randomDigits(3)}-${this.randomDigits(4)}`,
      `${this.randomDigits(3)}-${this.randomDigits(3)}-${this.randomDigits(4)}`,
      `(${this.randomDigits(3)}) ${this.randomDigits(3)}-${this.randomDigits(4)}`,
      `+1-${this.randomDigits(3)}-${this.randomDigits(3)}-${this.randomDigits(4)}`
    ];
    return this.pick(formats);
  }

  static randomFirstName() {
    const names = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily',
      'Robert', 'Lisa', 'William', 'Jennifer', 'James', 'Mary',
      'Christopher', 'Patricia', 'Daniel', 'Jessica', 'Matthew', 'Ashley'
    ];
    return this.pick(names);
  }

  static randomMiddleName() {
    const names = ['Lee', 'Marie', 'Ann', 'Ray', 'Lynn', 'James', 'Rose', 'Grace'];
    return this.pick(names);
  }

  static randomLastName() {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
      'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson',
      'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee'
    ];
    return this.pick(names);
  }

  static randomFullName() {
    return `${this.randomFirstName()} ${this.randomLastName()}`;
  }

  static randomUsername() {
    const firstNames = ['john', 'jane', 'mike', 'sarah', 'david', 'emily'];
    const suffixes = ['dev', 'tech', 'pro', 'user', ''];
    const firstName = this.pick(firstNames);
    const suffix = this.pick(suffixes);
    const number = this.randomInt(100, 999);
    return suffix ? `${firstName}_${suffix}${number}` : `${firstName}${number}`;
  }

  static randomAddress() {
    const numbers = this.randomInt(100, 9999);
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Park Ln', 'Elm St', 'Cedar Rd', 'Washington Blvd', 'Lake View Dr', 'Hill St', 'River Rd'];
    return `${numbers} ${this.pick(streets)}`;
  }

  static randomApartment() {
    const types = ['Apt', 'Suite', 'Unit', '#'];
    const type = this.pick(types);
    const number = this.randomInt(1, 500);
    return Math.random() > 0.3 ? `${type} ${number}` : ''; // 70% chance of having apartment
  }

  static randomCity() {
    const cities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin',
      'San Jose', 'Seattle', 'Denver', 'Boston', 'Portland'
    ];
    return this.pick(cities);
  }

  static randomState() {
    const states = [
      'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
      'Illinois', 'Ohio', 'Georgia', 'Michigan', 'North Carolina',
      'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana'
    ];
    return this.pick(states);
  }

  static randomZip() {
    return this.randomDigits(5);
  }

  static randomCountry() {
    const countries = [
      'United States', 'Canada', 'United Kingdom', 'Australia',
      'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden'
    ];
    return this.pick(countries);
  }

  static randomCompany() {
    const prefixes = ['Global', 'Dynamic', 'Smart', 'Tech', 'Digital', 'Innovative', 'Advanced', 'Premier'];
    const suffixes = ['Solutions', 'Systems', 'Industries', 'Corporation', 'Group', 'Technologies', 'Enterprises', 'Services'];
    return `${this.pick(prefixes)} ${this.pick(suffixes)}`;
  }

  static randomJobTitle() {
    const titles = [
      'Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer',
      'Marketing Specialist', 'Sales Representative', 'Project Manager',
      'Business Analyst', 'DevOps Engineer', 'Content Writer',
      'Customer Success Manager', 'Accountant', 'HR Specialist'
    ];
    return this.pick(titles);
  }

  static randomDepartment() {
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Customer Support'];
    return this.pick(departments);
  }

  static randomWebsite() {
    const names = ['mycompany', 'example', 'demo', 'test', 'sample', 'mybusiness'];
    const tlds = ['com', 'net', 'org', 'io'];
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
    return this.pick(['Male', 'Female', 'Other', 'Prefer not to say']);
  }

  static randomBirthDate() {
    const year = this.randomInt(1960, 2005);
    const month = String(this.randomInt(1, 12)).padStart(2, '0');
    const day = String(this.randomInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static randomRecentDate() {
    const year = this.randomInt(2022, 2025);
    const month = String(this.randomInt(1, 12)).padStart(2, '0');
    const day = String(this.randomInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static randomTime() {
    const hour = String(this.randomInt(8, 18)).padStart(2, '0');
    const minute = String(this.randomInt(0, 59)).padStart(2, '0');
    return `${hour}:${minute}`;
  }

  static randomDateTime() {
    const date = this.randomRecentDate();
    const time = this.randomTime();
    return `${date}T${time}`;
  }

  static randomUniversity() {
    const universities = [
      'Stanford University', 'MIT', 'Harvard University', 'UC Berkeley',
      'University of Michigan', 'Cornell University', 'Yale University',
      'Columbia University', 'Princeton University', 'University of Texas'
    ];
    return this.pick(universities);
  }

  static randomDegree() {
    const degrees = [
      'Bachelor of Science', 'Bachelor of Arts', 'Master of Science',
      'Master of Business Administration', 'Master of Arts', 'PhD'
    ];
    return this.pick(degrees);
  }

  static randomMajor() {
    const majors = [
      'Computer Science', 'Business Administration', 'Engineering',
      'Psychology', 'Economics', 'Marketing', 'Finance', 'Biology'
    ];
    return this.pick(majors);
  }

  static randomSalary() {
    const amounts = [50000, 60000, 75000, 85000, 100000, 120000, 150000];
    return String(this.pick(amounts));
  }

  static randomCreditCard() {
    // Test credit card number (not real)
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
      'Experienced professional with a proven track record of success.',
      'Passionate about innovation and delivering exceptional results.',
      'Dedicated team player with excellent communication skills.',
      'Results-driven individual with strong analytical abilities.',
      'Creative problem solver with attention to detail.',
      'Committed to continuous learning and professional development.'
    ];
    return this.pick(phrases);
  }

  static randomExperience() {
    const experiences = [
      '5+ years of experience in software development and project management.',
      'Proficient in multiple programming languages including Python, JavaScript, and Java.',
      'Strong background in data analysis and business intelligence.',
      'Experienced in leading cross-functional teams and delivering complex projects.',
      'Skilled in modern development practices and agile methodologies.'
    ];
    return this.pick(experiences);
  }

  static randomPassword() {
    // Generate a simple test password
    const words = ['Test', 'Demo', 'Sample', 'Pass'];
    const word = this.pick(words);
    const number = this.randomInt(1000, 9999);
    const special = this.pick(['!', '@', '#', '$']);
    return `${word}${number}${special}`;
  }

  static randomOption(options) {
    // Filter out empty options
    const validOptions = options.filter(opt => opt && opt.trim());
    if (validOptions.length === 0) return '';

    // Skip first option if it looks like a placeholder
    const firstOption = validOptions[0].toLowerCase();
    if (firstOption.includes('select') ||
        firstOption.includes('choose') ||
        firstOption.includes('--') ||
        firstOption === '' ||
        firstOption.length < 2) {
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
    let result = '';
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
    // Return text rating (Great, Good, Average, Poor)
    const ratings = ['Excellent', 'Great', 'Good', 'Average', 'Fair'];
    // Skew towards positive ratings (80% chance of Good or better)
    const rand = Math.random();
    if (rand < 0.4) return 'Excellent';
    if (rand < 0.7) return 'Great';
    if (rand < 0.85) return 'Good';
    if (rand < 0.95) return 'Average';
    return 'Fair';
  }

  static randomSatisfaction() {
    const levels = [
      'Very Satisfied',
      'Satisfied',
      'Neutral',
      'Dissatisfied',
      'Very Dissatisfied'
    ];
    // Skew towards satisfied (75% positive)
    const rand = Math.random();
    if (rand < 0.45) return 'Very Satisfied';
    if (rand < 0.75) return 'Satisfied';
    if (rand < 0.90) return 'Neutral';
    return this.pick(['Dissatisfied', 'Very Dissatisfied']);
  }

  static randomYesNo() {
    // 70% Yes, 30% No (generally positive)
    return Math.random() < 0.7 ? 'Yes' : 'No';
  }

  static randomLikertScale() {
    const scales = [
      'Strongly Agree',
      'Agree',
      'Neutral',
      'Disagree',
      'Strongly Disagree'
    ];
    // Skew towards agreement (70% agree or strongly agree)
    const rand = Math.random();
    if (rand < 0.35) return 'Strongly Agree';
    if (rand < 0.70) return 'Agree';
    if (rand < 0.85) return 'Neutral';
    if (rand < 0.95) return 'Disagree';
    return 'Strongly Disagree';
  }

  static randomFrequency() {
    const frequencies = [
      'Always',
      'Often',
      'Sometimes',
      'Rarely',
      'Never'
    ];
    // Normal distribution favoring middle options
    const rand = Math.random();
    if (rand < 0.15) return 'Always';
    if (rand < 0.45) return 'Often';
    if (rand < 0.75) return 'Sometimes';
    if (rand < 0.92) return 'Rarely';
    return 'Never';
  }

  static randomFeedback() {
    const feedbacks = [
      'Great experience overall! The service was excellent and exceeded my expectations.',
      'Everything went smoothly. Very pleased with the quality and professionalism.',
      'Good service with friendly staff. Would definitely recommend to others.',
      'The product works well and meets my needs. Happy with my purchase.',
      'Overall satisfied with the experience. Minor improvements could be made but nothing major.',
      'Quick and efficient service. Appreciate the attention to detail.',
      'Very responsive team and great communication throughout the process.',
      'The interface is intuitive and easy to use. Makes my work much easier.',
      'Excellent customer support. They resolved my issue promptly.',
      'High quality product and worth the investment. Very satisfied.',
      'The team was helpful and knowledgeable. Great experience from start to finish.',
      'Fast delivery and product was exactly as described. Very happy!',
      'Professional service and attention to customer needs. Will use again.',
      'Everything worked perfectly. No complaints whatsoever.',
      'Impressed with the quality and efficiency. Highly recommend!'
    ];
    return this.pick(feedbacks);
  }

  static randomReason() {
    const reasons = [
      'Looking for information about your products/services',
      'Need assistance with a purchase',
      'General inquiry about your offerings',
      'Interested in learning more about your company',
      'Seeking customer support',
      'Want to provide feedback',
      'Exploring options for a project',
      'Recommended by a friend',
      'Research and comparison shopping',
      'Following up on a previous inquiry'
    ];
    return this.pick(reasons);
  }

  static randomSource() {
    const sources = [
      'Google Search',
      'Friend or Family Recommendation',
      'Social Media (Facebook, Instagram, etc.)',
      'Online Advertisement',
      'Word of Mouth',
      'News Article or Blog',
      'Email Newsletter',
      'YouTube',
      'Review Website',
      'Professional Network (LinkedIn)',
      'Company Website',
      'Trade Show or Event'
    ];
    return this.pick(sources);
  }

  static randomAgeRange() {
    const ranges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    // Skew towards middle ranges
    const rand = Math.random();
    if (rand < 0.15) return '18-24';
    if (rand < 0.40) return '25-34';
    if (rand < 0.70) return '35-44';
    if (rand < 0.90) return '45-54';
    return this.pick(['55-64', '65+']);
  }

  static randomShortFeedback() {
    const shortFeedbacks = [
      'Great service!',
      'Very satisfied',
      'Excellent experience',
      'Would recommend',
      'Everything was perfect',
      'No complaints',
      'Good quality',
      'Fast and efficient',
      'Very helpful team',
      'Exceeded expectations'
    ];
    return this.pick(shortFeedbacks);
  }
}
