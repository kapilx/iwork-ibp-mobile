import { ibpTheme as theme } from "@ui/ui-lib";
import PhysicalIcon from "../../assets/svgs/physical-icon.svg";
import InsuranceIcon from "../../assets/svgs/insurance-icon.svg";
import EmotionalIcon from "../../assets/svgs/emotional-icon.svg";
import carSvg from "../../assets/svgs/car-insurance-icon.svg";
import travelsvg from "../../assets/svgs/travel.svg";
import summaryIcon from "../../assets/svgs/summary-icon.svg";

export const bannerData = {
  description:
    "Welcome to the Integrated Wellness Hub - IWH offers a range of benefits to support you at different stages of your life. This central point gives you access to all your benefits offered by your organization. All the benefits are listed in these categories - Insurance, Physical, Emotional. You can enroll for compulsory benefits, make changes to your flexible benefits, save with discounted prices offered for various benefits or can find out more about the various benefits.",
  cards: [
    {
      heading: "Explore",
      content:
        "Your insurance, simplified. Access all your policy details, track claims, and get clarity on your coverage.",
    },
    {
      heading: "Flex",
      content:
        "Your life, your choice. Use your Flexi Benefits to personalize your wellness and insurance experience.",
    },
    {
      heading: "Confirm",
      content:
        "Take charge of your benefits. Select, compare, and enroll in plans that work best for you and your loved ones.",
    },
  ],
};

export const cardsStyles = [
  {
    id: 1,
    background: theme.palette.summaryCards[8].bg,
    color: theme.palette.text.lightViolet,
  },
  {
    id: 2,
    background: theme.palette.summaryCards[9].bg,
    color: theme.palette.text.blueVariant,
  },
  {
    id: 3,
    background: theme.palette.summaryCards[10].bg,
    color: theme.palette.text.darkGreen,
  },
];

export const wellnessCardsData = {
  title: "Confirm Your Wellness Journey",
  cards: [
    {
      icon: InsuranceIcon,
      title: "Insurance Wellness",
      description:
        "Manage your insurance policies, track claims, and access coverage details",
      features: {
        policyManagement: "Policy Management",
        claimsTracking: "Claims Tracking",
        coverageInsights: "Coverage Insights",
        tpaServices: "TPA Services",
      },
      button: "Start Journey",
      path: "my-insurance",
      type: "insuranceWellness",
    },
    {
      icon: PhysicalIcon,
      title: "Physical Wellness",
      description:
        "Track your fitness journey, book wellness sessions, and monitor health metrics",
      features: {
        fitnessTracking: "Fitness Tracking",
        workoutSessions: "Workout Sessions",
        healthMetrics: "Health Metrics",
        nutritionPlans: "Nutrition Plans",
      },
      button: "Start Journey",
      type: "physicalWellness",
    },
    {
      icon: EmotionalIcon,
      title: "Emotional Wellness",
      description:
        "Access mental health resources, counseling services, and stress management tools",
      features: {
        mentalHealthSupport: "Mental Health Support",
        counselingServices: "Counseling Services",
        stressManagement: "Stress Management",
        mindfulness: "Mindfulness",
      },
      button: "Start Journey",
      type: "emotionalWellness",
    },
  ],
};

export const cardBackgroundColors = [
  {
    id: 1,
    background: theme.palette.summaryCards[11].bg,
  },
  {
    id: 2,
    background: theme.palette.summaryCards[9].bg,
  },
  {
    id: 3,
    background: theme.palette.summaryCards[10].bg,
  },
];

export const companyInsuranceData = {
  title: "Company provided insurances",
  cards: [
    {
      title: "Group Health Insurance",
      policyNumber: "69790309",
      sumInsured: "₹ 10,00,000",
      balance: "₹ 10,00,000",
      dependentsCount: 4,
      dueDate: "16 Oct 2025",
      claimsCount: 2,
    },
    {
      title: "Group Personal Accident",
      policyNumber: "69790309",
      sumInsured: "₹ 10,00,000",
      balance: "₹ 10,00,000",
      dependentsCount: 4,
      dueDate: "17 Oct 2025",
      claimsCount: 1,
    },
    {
      title: "Group Term life",
      policyNumber: "69790309",
      sumInsured: "₹ 10,00,000",
      balance: "₹ 10,00,000",
      dependentsCount: 4,
      dueDate: "24 Sep 2025",
    },
  ],
};
export const claimsData = {
  counts: { total: 8, approved: 2, pending: 1, actionRequired: 1 },
  policyNumber: "GMC-2024-EMP-001234",
  policyExpiry: "March 31, 2025",
  sumInsured: 500000,
  available: 350000,
  claimed: 150000,
  claims: [
    {
      name: "Ramanathan (Son)",
      claimId: "#CLM24561",
      requestedOn: "24 April,2025",
      amount: 25000,
      docsLabel: "1 Hospital doc. pdf",
      status: "Approved",
      labels: {
        claimRequested: "Claim Requested",
        claimAmount: "Claim amount",
        documents: "Documents",
      },
    },
    {
      name: "Ramanathan (Son)",
      claimId: "#CLM24561",
      requestedOn: "24 April,2025",
      amount: 25000,
      docsLabel: "1 Hospital doc. pdf",
      status: "Rejected",
      labels: {
        claimRequested: "Claim Requested",
        claimAmount: "Claim amount",
        documents: "Documents",
      },
    },
  ],
  family: {
    title: "Family Members Covered",
    members: [
      { name: "Sri Venkata Ravi Rama Krishna", relation: "Self" },
      { name: "Mahalakshmi", relation: "Spouse" },
      { name: "Ramanathan", relation: "Son" },
      { name: "Jasmine", relation: "Daughter" },
    ],
  },
  labels: {
    pageTitle: "Claim summary",
    claimStatus: "Claim Status",
    totalClaims: "Total Claims",
    approved: "Approved",
    pending: "Pending",
    actionRequired: "Action Required",
    policyNumber: "Policy Number",
    policyExpiry: "Policy Expiry",
    sumInsured: "Sum Insured",
    available: "Available",
    claimed: "Claimed",
  },
};

export const personalInsuranceData = [
  {
    id: "car-1",
    type: "Car Insurance",
    policyNumber: "CAR202598754",
    details: {
      item: "Maruti Suzuki Baleno (TS AB 1234)",
      itemLabel: "Vehicle",
      insuredValue: "₹ 6,00,000",
      insuredValueLabel: "Insured Value",
      expiryDate: "30 Jun 2026",
      expiryLabel: "Expires",
    },
    icon: carSvg,
    altText: "Decorative car",
  },
  {
    id: "travel-1",
    type: "Travel Insurance",
    policyNumber: "CAR202598754",
    details: {
      item: "Maruti Suzuki Baleno (TS AB 1234)",
      itemLabel: "Vehicle",
      insuredValue: "₹ 6,00,000",
      insuredValueLabel: "Insured Value",
      expiryDate: "30 Jun 2026",
      expiryLabel: "Expires",
    },
    icon: travelsvg,
    altText: "Decorative travel",
  },
];

export const wellnessSummaryData = {
  title: "Wellness Services Summary",
  icon: summaryIcon,
  summaryStats: [
    {
      id: "services-consumed",
      value: "24",
      label: "Services Consumed",
    },
    {
      id: "money-spent",
      value: "₹15,800",
      label: "Money Spent",
    },
    {
      id: "savings-earned",
      value: "₹4,200",
      label: "Savings Earned",
    },
    {
      id: "upcoming-appointments",
      value: "3",
      label: "Upcoming Appointments",
    },
  ],
  appointments: [
    {
      id: "appointment-1",
      service: "Physiotherapy Session",
      date: "Tomorrow",
      time: "2:00 PM",
      status: "Scheduled",
    },
    {
      id: "appointment-2",
      service: "Nutrition Consultation",
      date: "Dec 25",
      time: "2:00 PM",
      status: "Scheduled",
    },
    {
      id: "appointment-3",
      service: "Mental Health Counseling",
      date: "Tomorrow",
      time: "2:00 PM",
      status: "Scheduled",
    },
  ],
};
