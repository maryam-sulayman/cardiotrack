export function getHeartRiskScore(user) {
    const {
      ap_hi, ap_lo, age, cholesterol, gluc, bmi, weight, height, smoke
    } = user;
  
    if (ap_hi <= 129.5) {
      if (age <= 19963) {
        if (cholesterol <= 2.5) {
          if (age <= 16099.5) {
            return { score: 10, risk: "Low" };
          } else {
            if (ap_hi <= 118.5) {
              return { score: 10, risk: "Low" };
            } else {
              return { score: 10, risk: "Low" };
            }
          }
        } else { // cholesterol > 2.5
          if (gluc <= 2.5) {
            if (bmi <= 22.99) {
              return { score: 10, risk: "Low" };
            } else {
              return { score: 60, risk: "High" };
            }
          } else {
            if (bmi <= 32.49) {
              return { score: 10, risk: "Low" };
            } else {
              return { score: 60, risk: "High" };
            }
          }
        }
      } else { // age > 19963
        if (cholesterol <= 2.5) {
          if (age <= 22172.5) {
            return { score: 10, risk: "Low" };
          } else {
            if (weight <= 52.5) {
              return { score: 10, risk: "Low" };
            } else {
              return { score: 60, risk: "High" };
            }
          }
        } else {
          return { score: 60, risk: "High" };
        }
      }
    } else { // ap_hi > 129.5
      if (ap_hi <= 138.5) {
        if (cholesterol <= 2.5) {
          if (age <= 21739) {
            if (ap_lo <= 89.5) {
              return { score: 10, risk: "Low" };
            } else {
              return { score: 60, risk: "High" };
            }
          } else {
            if (smoke <= 0.5) {
              return { score: 60, risk: "High" };
            } else {
              return { score: 10, risk: "Low" };
            }
          }
        } else {
          if (gluc <= 2.5) {
            if (ap_hi <= 136.5) {
              return { score: 60, risk: "High" };
            } else {
              return { score: 10, risk: "Low" };
            }
          } else {
            return { score: 60, risk: "High" };
          }
        }
      } else if (ap_hi <= 149.5) {
        return { score: 60, risk: "High" };
      } else {
        if (ap_lo <= 68.5) {
          if (height <= 151.5) {
            return { score: 10, risk: "Low" };
          } else {
            return { score: 60, risk: "High" };
          }
        } else {
          if (height <= 137) {
            return { score: 10, risk: "Low" };
          } else {
            return { score: 60, risk: "High" };
          }
        }
      }
    }
  }
  