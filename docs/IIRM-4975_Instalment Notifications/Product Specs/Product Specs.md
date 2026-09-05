# **Updated Product Specification: Installment Due Date Notification for BD Executives**

## **1\. Feature Overview**

This enhancement introduces automated email notifications to BD Executives before an installment due date to ensure timely follow-ups on premium payments.

---

## **2\. Current Behavior**

* Each sales opportunity progresses through multiple stages.

* In Placement slip stage, the BD Executive specifies whether the premium is **lump sum** or **installment-based**.

* If installment-based, the user enters:

  * Installment due date

  * Installment amount

* **Current limitation:** No pre-due-date reminder is sent to the BD Executive.

---

## **3\. Problem Statement**

BD Executives are missing timely follow-ups because the system does not alert them before installment due dates, leading to delays in payment collection.

---

## **4\. Proposed Enhancement**

Enable the system to automatically send an email notification to the BD Executive before the installment due date.

---

## **5\. Expected Behavior**



### **5.2 Notification Channel**

* Email

### **5.3 Notification Recipients**

* Primary recipient: Assigned BD Executive

### **5.4 Notification Template**

Should include:

* Policy ID

* Customer Name

* Installment Due Amount

* Installment Due Date

* Link to opportunity details

---

## **6\. Functional Requirements**

### **6.1 Installment Data Capture**

* Store installment due date and amount per opportunity for scheduler processing.

### **6.2 Notification Scheduler**

* A daily scheduled job will:

  * Identify installment entries matching the  **notification rule**

  * Trigger notification email using the template

### **6.3 Duplicate Notification Control**

* System must ensure:

  * Only the defined number of reminders  are sent

  * No repeating beyond the defined count

### **6.4 Lead Time Configuration (Testing Support)**

* Production lead-time will be defined (expected unit: days) once business rule is finalized (TBD).
* For testing and QA, the notification lead-time MUST be configurable in HOURS (e.g., 1h, 4h, 6h, 12h before due date) without code change.
* Hour-based configuration applies only in non-production environments (dev / test / staging).
* Recommended mechanisms (implementation choice):
  * Environment variable: `INSTALLMENT_NOTIFICATION_LEAD_HOURS`
  * Or config-service entry flagged `testingOnly=true`.
* Precedence: If an hour value is present in a non-production environment it overrides the day-based value for evaluation logic; production ignores hour-based settings.
* Validation: Accept only positive integers (1–72). Invalid values fall back to day-based rule.
* Logging: Each scheduler run must log which mode (days vs hours) was applied and the effective lead-time value.
* No persistence change: The policy / opportunity stored installment due date remains untouched; only calculation window changes.

---

## **8\. Acceptance Criteria**

1. Email notification is sent before the due date based on the finalized TBD lead-time.

2. Email reaches the correct BD Executive.

3. Email includes correct details (amount, date, opportunity ID, link).

4. Number of reminders aligns with the TBD rule.

5. No duplicate reminders beyond what is defined.

6. Notifications adjust if due date changes.

7. Logs are maintained for each sent notification.
8. In non-production environments, setting an hour-based lead-time (e.g., 2) results in notifications being evaluated and sent according to that hour configuration, with logs showing the applied hour value and mode.

Notification Templete

**Subject:** Reminder: Upcoming Installment Due on {{DueDate}} for Policy {{PolicyNumber}}  
---

**Hi {{BDExecutiveName}},**

This is a reminder that an installment payment for one of your policies is due soon. If the installment is already paid, please ignore this message.

### **Installment Details**

* **Policy Number:** {{PolicyNumber}}

* **Policy Name:** {{PolicyName}}

* **Customer / Company Name:** {{CustomerName}}

* **Installment Amount:** {{InstallmentAmount}}

* **Installment Due Date:** {{DueDate}}

### **Action Required**

Please follow up with the customer to ensure timely payment of the installment.

To view complete policy details, click the link below:  
 **{{PolicyLink}}**

---

**Thanks,**  
 **{{CompanyName}}

