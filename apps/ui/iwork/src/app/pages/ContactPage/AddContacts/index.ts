export default function getPercentageData(
  getData: any,
  setPercentage: React.Dispatch<
    React.SetStateAction<{ filledValues: number; totalFields: number }>
  >
) {
  const DEFAULT_CHILD = {
    childName: undefined,
    childDob: undefined,
    childGender: undefined,
  };
  const DEFAULT_COMMUNICATION = {
    communicationType: undefined,
    communicationDetails: undefined,
  };
  const DEFAULT_PROFESSIONAL_EXPERIENCE = {
    fromDate: undefined,
    toDate: undefined,
    company: undefined,
    designation: undefined,
    department: undefined,
    details: undefined,
  };
  const DEFAULT_QUALIFICATION_EXPERIENCE = {
    nameOfQualification: undefined,
    yearOfQualification: undefined,
    details: undefined,
    universityName: undefined,
  };

  const DEFAULT_ADDRESS = {
    addressTypeLid: undefined,
    address1: undefined,
    address2: undefined,
    area: undefined,
    countryId: undefined,
    stateId: undefined,
    cityId: undefined,
    pinCode: undefined,
    email: undefined,
    phoneNumber: undefined,
    alternatePhoneNumber: undefined,
    supportNumber: undefined,
  };

  const formattedData = {
    contact: {
      salutationLid: getData?.salutation?.id,
      firstName: getData?.firstName,
      middleName: getData?.middleName,
      lastName: getData?.lastName,
      displayName: getData?.displayName,
      linkedInUrl: getData?.linkedInUrl,
      companyId: getData?.company?.id,
      companyLocationId: getData?.companyLocation?.id,
      companyBranchId: getData?.companyBranchId,
      tagLid: getData?.tag?.id,
      contactTypeLid: getData?.contactType?.id,
      departmentId: getData?.department?.id,
      designationId: getData?.designation?.id,
      reportingToId: getData?.reportingTo?.id,
      relationshipTypeLid: getData?.relationshipType?.id,
      remarks: getData?.remarks,
    },

    addresses:
      (getData?.address?.length || 0) > 0
        ? getData?.address?.map((item: any) => ({
            addressTypeLid: item?.addressType?.id,
            address1: item?.address1,
            address2: item?.address2,
            area: item?.area,
            countryId: item?.countryId?.id,
            stateId: item?.stateId?.id,
            cityId: item?.cityId?.id,
            pinCode: item?.pinCode,
            email: item?.email,
            phoneNumber: item?.phoneNumber,
            alternatePhoneNumber: item?.alternatePhoneNumber,
            supportNumber: item?.supportNumber,
          }))
        : [DEFAULT_ADDRESS],

    contactDetails: {
      gender: getData?.contactDetails?.genderType?.id,
      dateOfBirth: getData?.contactDetails?.dateOfBirth,
      favouriteFood: getData?.contactDetails?.favouriteFood,
      favouriteRestaurant: getData?.contactDetails?.favouriteRestaurant,
      personalHistory: getData?.contactDetails?.personalHistory,
      majorAchievements: getData?.contactDetails?.majorAchievements,
      maritalStatus: getData?.contactDetails?.maritalStatus,
      dateOfWedding: getData?.contactDetails?.dateOfWedding,
      spouseName: getData?.contactDetails?.spouseName,
      spouseDateOfBirth: getData?.contactDetails?.spouseDateOfBirth,
      spouseWorkingStatus: getData?.contactDetails?.spouseWorkingStatus,
      workingCompany: getData?.contactDetails?.workingCompany,
      childDetails:
        (getData?.contactDetails?.childDetails?.length || 0) > 0
          ? getData?.contactDetails?.childDetails?.map((child: any) => ({
              childName: child?.childName,
              childDob: child?.childDob,
              childGender: child?.childGender,
            }))
          : [DEFAULT_CHILD],
    },

    professionalExperiences:
      (getData?.professionalExperiences?.length || 0) > 0
        ? getData?.professionalExperiences?.map((experience: any) => ({
            fromDate: experience?.fromDate,
            toDate: experience?.toDate,
            company: experience?.company,
            designation: experience?.designation,
            department: experience?.department,
            details: experience?.details,
          }))
        : [DEFAULT_PROFESSIONAL_EXPERIENCE],

    qualificationExperiences:
      (getData?.qualificationExperiences?.length || 0) > 0
        ? getData?.qualificationExperiences?.map((qualification: any) => ({
            nameOfQualification: qualification?.nameOfQualification,
            yearOfQualification: qualification?.yearOfQualification,
            details: qualification?.details,
            universityName: qualification?.universityName,
          }))
        : [DEFAULT_QUALIFICATION_EXPERIENCE],

    communicationDetails:
      (getData?.communicationDetails?.length || 0) > 0
        ? getData?.communicationDetails?.map((communication: any) => ({
            communicationType: communication?.communicationType,
            communicationDetails: communication?.communicationDetails,
          }))
        : [DEFAULT_COMMUNICATION],
  };

  setPercentage(countFilledFields(formattedData));
}

function countFilledFields(obj: any): {
  filledValues: number;
  totalFields: number;
} {
  let filledValues = 0;
  let totalFields = 0;

  function traverse(value: any) {
    if (Array.isArray(value)) {
      value.forEach((item) => traverse(item));
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach((val) => traverse(val));
    } else {
      // Count every primitive value as a field
      totalFields += 1;
      // Check if the value is filled
      if (value !== null && value !== undefined && value !== "") {
        filledValues += 1;
      }
    }
  }

  traverse(obj);
  return { filledValues, totalFields };
}
