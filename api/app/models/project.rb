class Project < ApplicationRecord

  include UserOwnedModel

  belongs_to :parent, required: false
  has_many :children, class_name: self, foreign_key: :parent_id

end
