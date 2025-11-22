# Multi-Profile & Custom Fields Guide

## New Features

### 1. **Multiple Profiles**
You can now create and manage multiple profiles for different contexts:
- **Work Profile**: Professional information
- **Personal Profile**: Personal details
- **Testing Profile**: Test data for development

**How to use:**
1. Open Settings (⚙️ icon in extension popup)
2. Click **"+ New Profile"** button
3. Enter a profile name (e.g., "Work", "Personal")
4. Fill in the fields
5. Click **"Save Profile"**

**Switching Profiles:**
- Use the dropdown at the top of the settings page
- Select a profile to make it active
- The active profile will be used when you click **"My Profile"** in the popup

### 2. **Custom Fields**
Add any custom fields you need for specific forms:

**How to add custom fields:**
1. Scroll to **"Custom Fields"** section
2. Click **"+ Add Field"** button
3. Enter field name (e.g., "Student ID", "Employee Number", "LinkedIn")
4. Select field type (Text, Number, Email, Phone, URL, Date)
5. Enter field value
6. Click **"Save Profile"**

**Field Types:**
- **Text**: General text input
- **Number**: Numeric values only
- **Email**: Email addresses
- **Phone**: Phone numbers
- **URL**: Website addresses
- **Date**: Date values

**Custom Field Matching:**
The extension will automatically match your custom fields to form fields based on the field name. For example:
- Custom field "Student ID" will match form fields containing "student id"
- Custom field "LinkedIn" will match form fields containing "linkedin"

### 3. **Profile Selector**
The active profile selector is located at the top of the settings page:
- **Blue highlighted box** shows your currently active profile
- **Dropdown** lets you switch between profiles
- Selected profile is used for **"My Profile"** fills

## UI Updates

### Color Scheme
- **Green** (#10b981): Save buttons, success states
- **Blue** (#3b82f6): Active profile selector, links, Smart Fill button
- **Grey** (#64748b): Secondary buttons, Random Data button
- **Black** (#1e293b): Delete button, headings

### Layout
- **Header**: Profile selector prominently displayed
- **API Section**: OpenAI configuration for Smart Fill
- **Profile Section**: Standard fields + custom fields
- **Grid Layout**: Standard fields in 2-column grid for better organization

## How It Works

### Standard Fields
These are always available in every profile:
- Full Name
- Email
- Phone
- Address
- Company
- Job Title
- Bio/Description

### Custom Fields
- **Unlimited**: Add as many custom fields as you need
- **Flexible**: Choose the appropriate type for each field
- **Smart Matching**: Automatically matches to form fields by name
- **Per-Profile**: Each profile can have different custom fields

### Profile Management

**Creating a Profile:**
```
1. Click "+ New Profile"
2. Profile Name: "Work"
3. Fill in standard fields (name, email, etc.)
4. Add custom fields:
   - Field: "Employee ID", Type: Number, Value: "12345"
   - Field: "Department", Type: Text, Value: "Engineering"
5. Click "Save Profile"
```

**Switching Profiles:**
```
1. Use dropdown: "Active Profile: Work"
2. Change to: "Personal"
3. Form fields will now use Personal profile data
```

**Deleting a Profile:**
```
1. Select the profile from dropdown
2. Click "Delete Profile" button
3. Confirm deletion
4. Note: Cannot delete the last profile
```

## Storage

All data is stored locally in your browser using Chrome's storage API:
- **profiles**: Array of all profiles
- **settings**: API key and other settings

**Data Structure:**
```javascript
{
  profiles: [
    {
      id: "profile_1234567_abcd",
      profileName: "Work",
      isActive: true,
      name: "John Doe",
      email: "john@company.com",
      phone: "+1-555-1234",
      address: "123 Main St",
      company: "Acme Corp",
      jobTitle: "Engineer",
      bio: "Software developer",
      customFields: [
        { name: "Employee ID", value: "12345", type: "number" },
        { name: "LinkedIn", value: "linkedin.com/in/johndoe", type: "url" }
      ]
    }
  ],
  settings: {
    apiKey: "sk-..."
  }
}
```

## Tips

1. **Organize by Context**: Create separate profiles for work, personal, testing
2. **Use Custom Fields**: Add company-specific or form-specific fields
3. **Field Names Matter**: Name custom fields to match common form labels
4. **Active Profile**: The profile marked as active is used for fills
5. **Backup Important Data**: Consider saving profile data elsewhere as backup

## Troubleshooting

**Profile not filling fields:**
- Check that the profile is set as active (dropdown)
- Verify custom field names match form field labels
- Ensure custom field values are not empty

**Custom field not matching:**
- Field name should match the form label (case-insensitive)
- Use simple, common names (e.g., "student id" not "student_id_number")
- Check the field type matches the form field type

**Cannot delete profile:**
- Must have at least one profile
- Create a new profile before deleting the last one
