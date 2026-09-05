import { requiredErrorMessage } from "@ui/ui-lib/constants";
import dayjs from "dayjs";

export const expiryDateFieldConfig = [
  {
    key: "expiryDate",
    name: "expiryDate",
    label: "Extend expiry date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      // minDate: dayjs(),
      minDate: dayjs().add(1, "day"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Opportunity expiry date"), //todo
      },
      validate: (value) => {
        const date = new Date(value);
        const today = new Date();
        return (
          date > today || "Opportunity expiry date should be greater than today"
        );
      },
    },
  },
];

export const defaultFormValues = {
  expiryDate: dayjs().add(7, "day").format("YYYY-MM-DD"),
};
