class LoginRequest

  include ActiveModel::Model

  attr_accessor :email

  validate :email_belongs_to_user?

  def save validate: true
    if !validate || valid?
      user.regenerate_temporary_token
      LoginMailer.login(user).deliver
    end
  end

  private

  def user
    @user ||= User.find_by(email: email)
  end

  def email_belongs_to_user?
    unless user
      errors.add(:email, 'does not exist')
    end
  end

end
