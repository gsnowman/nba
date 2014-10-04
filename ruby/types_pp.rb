require 'types'

class Player
  def to_s
    "first=#{@first} last=#{@last} id=#{@player_id} number=#{@number} pos=#{@pos} height=#{@height} " +
      "weight=#{@weight} age=#{@age} exp=#{@exp} college=#{@college} salary=#{@salary} team=#{@team} " +
      "owned=#{@owned} rotoworld=#{@rotoworld} watch=#{@watch} drafted=#{@drafted}"
  end
end
