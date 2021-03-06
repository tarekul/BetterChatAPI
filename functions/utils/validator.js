const emailValidator = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(emailRegEx)) return true
  return false
}

const isEmpty = input => {
  if(input.trim() === '') return true
  return false
}

exports.validateSignUp = (email,password,confirmPassword,username) =>{
  const errors = {}

  if(isEmpty(email)) errors.email = 'Must enter an email'
  else if(!emailValidator(email)) errors.email = 'Must enter correctly formatted email'

  if(isEmpty(password)) errors.password = 'Must enter password'
  else if(password != confirmPassword) errors.password = 'passwords must match'

  if(isEmpty(username)) errors.username = 'Must enter username'

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.validateLogin = (email,password) => {
  const errors = {}
  if(isEmpty(email)) errors.email = 'Must enter an email'
  else if(!emailValidator(email)) errors.email = 'Must enter correctly formatted email'

  if(isEmpty(password)) errors.password = 'Must enter password'

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}