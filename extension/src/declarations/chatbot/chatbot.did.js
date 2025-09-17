export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({ 'ask' : IDL.Func([IDL.Text], [Result], []) });
};
export const init = ({ IDL }) => { return []; };
