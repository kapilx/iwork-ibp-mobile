# **PRODUCT SPECIFICATION DOCUMENT**

## **Feature Name:**

**Schedule Callback & Support Request Module**

## **Version: 1.0**

## **Owner: Product Team**

---

# **1\. Overview**

The system needs to enable employees to raise service requests in two categories:

1. **Schedule Callback**  
2. **Support Request (Escalation)**

These requests will be routed to the **Operations Support Team** based on the contact details collected from the **Operations Support Details** section under Policy Details approval stage.

Both modules should maintain a complete history of all requests made by the user, and allow users to escalate when they don’t receive a response.

---

# **2\. Prerequisite: Operations Support Details Section**

### **Purpose**

Collect routing details for callback and escalation emails.

### **Fields (Captured during Policy Approval stage):**

* **Email** (Mandatory)  
* **Phone Number** (Optional)

### **Rules:**

* All callback and escalation requests must be sent ONLY to this email.  
* Confirmation emails back to the user should also use this stored email.

---

# **3\. MODULE 1 — Schedule Callback**

## **3.1 Purpose**

Allow users to request a callback from operations within a specified schedule window and track all previous callback requests.

---

## **3.2 User Flow**

1. User navigates to **Schedule Callback** screen.  
2. System checks if user has previously submitted callback requests.  
   * If yes → Show **history list** (most recent on top).  
   * If none → Show **empty state message**.   
3. User fills in callback form.  
4. User selects date/time within allowed window.  
5. On submit:  
   * Email is triggered to Operations Support Email.  
   * User receives confirmation notification on the same email.

---

## **3.3 Form Fields & Requirements**

| Field | Type | Required | Notes |
| ----- | ----- | ----- | ----- |
| **Callback Reason** | Dropdown | Yes | Values: Claims, Enrollment, Network Hospital, Wellness, TPA, Policy, Claim Reassessment, Others |
| **Description** | Text | Optional | User can describe issue |
| **Name** | Text | Yes | Pre-fill if available |
| **Phone Number** | Number | Yes | Pre-filled from user profile |
| **Preferred Date** | Date picker | Yes | Must meet scheduling constraints |
| **Preferred Time** | Time | Yes | Must be between **10 AM to 5 PM** |
| **CTA: Cancel** | Button | No | Closes form |
| **CTA: Submit** | Button | Yes | Triggers email |

---

## **3.4 Scheduling Rules**

* The user must choose a date **from next day to 6th day from request date**.  
   **Example:**  
   If request raised on *8th Dec* → Allowed dates \= *9th to 13th Dec*  
* Allowed time slots:  
   **10:00 AM – 5:00 PM**  
* Available future days should dynamically adjust based on current date.

---

## **3.5 Callback Request History (Display Requirements)**

Show all callback requests by the user in a reverse chronological order (newest → oldest).

Each entry must show:

* Callback Reason  
* Description (if provided)  
* Last callback requested date & time  
* Scheduled callback date & time  
* **CTA → “Callback Not Received”** (if no response received)

On clicking **Callback Not Received**:

* Send email to Operations Support Email with **HIGH PRIORITY** tag.  
* Update status in history.

Empty state message:

“No Callback request initiated.”

---

## **3.6 Email Routing Rules**

**On Submit:**

* Trigger callback request email to Operations Support Email.  
* Include user details \+ selected date/time \+ callback topic.

**On “Callback not received” CTA:**

* Trigger “High Priority” escalation email to same address.

**User Notification:**

* Send confirmation email to the same stored email ID from Operations Support Details.

---

# **4\. MODULE 2 — Support Request (Escalation)**

## **4.1 Purpose**

Allow users to raise escalations and track responses. This is a higher-priority workflow compared to callback.

---

## **4.2 User Flow**

1. User navigates to **Support Request** screen.

2. System checks user’s previous escalations:

   * If yes → Show list (newest on top).

   * If none → Show empty state.

3. User submits escalation form.

4. Email is sent to Operations Support Email.

5. If user did not receive a reply, they can trigger **Issue Not Resolved** escalation.

---

## **4.3 Form Fields & Requirements**

| Field | Type | Required | Notes |
| ----- | ----- | ----- | ----- |
| **Topic** | Dropdown | Yes | Same values as callback |
| **Name** | Text | Yes | Pre-filled |
| **Escalation Description** | Text | Yes | Mandatory |
| **Email** | Text | Yes | Pre-filled from Ops Support Details |
| **CTA: Cancel** | Button | No | Closes form |
| **CTA: Submit** | Button | Yes | Sends email |

---

## **4.4 Escalation History (Display Requirements)**

For each escalation, show:

* Topic

* Escalation Description

* Submission date & time

* **CTA → “Issue Not Resolved”**

When user clicks **Issue Not Resolved**:

* Trigger **HIGH PRIORITY escalation email** to operations support email.

* Add tag “Repeated Issue – High Priority”.

Empty state message:

“No escalations initiated.”

---

## **4.5 Email Routing Rules**

**On Submit:**

* Route to Operations Support Email.

* Include topic, issue, user details.

**On “Issue not resolved”:**

* Trigger high-priority escalation mail.

---

# **5\. Common Functional Requirements (For Both Modules)**

| Requirement | Description |
| ----- | ----- |
| **Routing Email** | Always fetched from Operations Support Details |
| **User Notification** | User receives confirmation on same stored email |
| **History Sorting** | Most recent request at the top |
| **History Persistence** | All requests must be stored and retrievable |
| **High Priority Tagging** | Add “\[HIGH PRIORITY\]” in subject for follow-ups |
| **Tracking** | Add **IIRM tracking** (system audit log) for all requests |
| **Validation** | All mandatory fields must be validated before submission |

---

# **6\. UI Requirements**

### **6.1 Callback Screen Sections**

1. Page Header

2. Callback Request Form

3. Scheduling Controls

4. Callback History List

5. Empty State UI

### **6.2 Support Request Screen Sections**

1. Page Header

2. Escalation Form

3. Escalation History List

4. Empty State UI

---

# **7\. Backend Requirements**

### **7.1 APIs Required**

1. **Get Ops Support Details API**

2. **Submit Callback Request API**

3. **Submit Support Request API**

4. **Get User Callback History API**

5. **Get User Escalation History API**

6. **Trigger High Priority Callback Email API**

7. **Trigger High Priority Escalation Email API**

### **7.2 Database Tables**

#### **Operations Support Details Table**

* Policy ID

* Email

* Phone Number

#### **Callback Requests Table**

* Request ID

* User ID

* Topic

* Description

* Requested At

* Scheduled For

* Status

* High Priority Flag

#### **Support Requests Table**

* Request ID

* User ID

* Topic

* Description

* Submitted At

* Status

* High Priority Flag

---

# **8\. Error Handling Requirements**

* If Ops Support Email missing → show:

   “Operations support details are not configured. Please contact administrator.”

* Date outside allowed range → block submission.

* Time outside allowed window → show error.

* Mandatory fields missing → show inline validation.

---

# **9\. Notification Requirements**

### **Emails Sent To Operations Support Email Must Include:**

* User details

* Topic

* Description

* Contact number

* Callback date/time (for callback)

* Priority (normal/high)

### **Emails Sent To User Must Include:**

* Confirmation of submission

* Request ID

* Date & Time

---

# **10\. Non-Functional Requirements**

* Response Time: \< 3 seconds

* Data must be stored securely.

* Audit logs for every request (IIRM).

* Fully mobile responsive.

* Supports concurrent requests.

---

# **11\. Success Metrics**

* Increase in callback completion rate

* Decrease in pending escalations

* Reduction in manual follow-ups

* Faster resolution time

