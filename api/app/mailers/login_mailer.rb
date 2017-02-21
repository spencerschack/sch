class LoginMailer < ApplicationMailer

  default from: ENV['SMTP_USER_NAME']

  def login user
    @url = "#{ENV['UI_URL']}/login/#{user.temporary_token}"
    mail to: user.email, subject: 'Login'
  end

end
