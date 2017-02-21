module AuthenticatedController

  extend ActiveSupport::Concern

  included do

    before_action :authenticate_user_from_token!

  end

  def authenticate_user_from_token!
    authenticate_with_http_token do |token|
      unless @current_user = User.find_by(persistent_token: token)
        render nothing: true, status: :unauthorized
      end
    end
  end

  def context
    { current_user: @current_user }
  end

end
