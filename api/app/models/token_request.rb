class TokenRequest

  include ActiveModel::Model

  attr_accessor :temporary_token, :persistent_token

  validate :token_belongs_to_user?

  def save validate: true
    if !validate || valid?
      user.regenerate_temporary_token
      self.persistent_token = user.persistent_token
    end
  end

  private

  def user
    @user ||= User.find_by(temporary_token: temporary_token)
  end

  def token_belongs_to_user?
    unless user
      errors.add(:temporary_token, 'is incorrect')
    end
  end

end
