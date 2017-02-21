module UserOwnedResource

  extend ActiveSupport::Concern

  included do

    before_create :set_user

  end

  class_methods do

    def records options = {}
      super.where(user: options[:context][:current_user])
    end

  end

  def set_user
    @model.user = context[:current_user]
  end

end
