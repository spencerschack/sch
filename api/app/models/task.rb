class Task < ApplicationRecord

  include UserOwnedModel

  belongs_to :project, required: false

  validates :start, presence: true

end
