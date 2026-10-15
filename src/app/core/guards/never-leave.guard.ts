/**
 * Guard is used when user is never meant to navigate from this page, use it for can deactivate
 * @returns always false
 */
export const neverLeave = () => {
  return false;
};
