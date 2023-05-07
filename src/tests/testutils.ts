import MockDiscord from './mockDiscord'

/* Spy 'reply' */
export function mockInteractionAndSpyReply(command) {
  const discord = new MockDiscord({ command })
  const interaction = discord.getInteraction() as CommandInteraction
  const spy = jest.spyOn(interaction, 'reply') 
  return { interaction, spy }
}

export async function executeCommandAndSpyReply(command, content, config = {}) {
  const { interaction, spy } = mockInteractionAndSpyReply(content)
  const commandInstance = new command(interaction, {...defaultConfig, ...config})
  await commandInstance.execute()
  return spy
}

// getParsedCommand implementation 

export const optionType = {
    // 0: null,
    // 1: subCommand,
    // 2: subCommandGroup,
    3: String,
    4: Number,
    5: Boolean,
    // 6: user,
    // 7: channel,
    // 8: role,
    // 9: mentionable,
    10: Number,
  }
  
  function getNestedOptions(options) {
    return options.reduce((allOptions, option) => {
      if (!option.options) return [...allOptions, option]
      const nestedOptions = getNestedOptions(option.options)
      return [option, ...allOptions, ...nestedOptions]
    }, [])
  }
  
  function castToType(value: string, typeId: number) {
    const typeCaster = optionType[typeId]
    return typeCaster ? typeCaster(value) : value
  }
  
  export function getParsedCommand(stringCommand: string, commandData) {
    const options = getNestedOptions(commandData.options)
    const optionsIndentifiers = options.map(option => `${option.name}:`)
    const requestedOptions = options.reduce((requestedOptions, option) => {
      const identifier = `${option.name}:`
      if (!stringCommand.includes(identifier)) return requestedOptions
      const remainder = stringCommand.split(identifier)[1]
  
      const nextOptionIdentifier = remainder.split(' ').find(word => optionsIndentifiers.includes(word))
      if (nextOptionIdentifier) {
        const value = remainder.split(nextOptionIdentifier)[0].trim()
        return [...requestedOptions, {
          name: option.name,
          value: castToType(value, option.type),
          type: option.type
        }]
      }
  
      return [...requestedOptions, {
        name: option.name,
        value: castToType(remainder.trim(), option.type),
        type: option.type
      }]
    }, [])
    const optionNames = options.map(option => option.name)
    const splittedCommand = stringCommand.split(' ')
    const name = splittedCommand[0].replace('/', '')
    const subcommand = splittedCommand.find(word => optionNames.includes(word))
    return {
      id: name,
      name,
      type: 1,
      options: subcommand ? [{
        name: subcommand,
        type: 1,
        options: requestedOptions
      }] : requestedOptions
    }
  }
  