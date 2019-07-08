const linearLogic = require('../functions/linearLogic');

describe('convert metlink line ids to kiwirail line ids', function() {
  it('uses association map to convert', function() {
    let kiwirailLineId = linearLogic.convertMetlinkLinetoKiwirailLine('JVL');
    expect(kiwirailLineId).toBe('JVILL');
    kiwirailLineId = linearLogic.convertMetlinkLinetoKiwirailLine('MEL');
    expect(kiwirailLineId).toBe('MLING');
  });
});

describe('convert kiwirail line ids to metlink line ids', function() {
  it('uses association map to convert', function() {
    let metlinkLineId = linearLogic.convertKiwirailLinetoMetlinkLine('NIMT');
    expect(metlinkLineId).toBe('KPL');
    metlinkLineId = linearLogic.convertKiwirailLinetoMetlinkLine('WRAPA');
    expect(metlinkLineId).toBe('WRL');
  });
});

describe('convert service Id text string to numcharId', function() {
  it('for each character if number then N if character then C', function() {
    let numcharId = linearLogic.convertToNumChar('2601');
    expect(numcharId).toBe('NNNN');
    numcharId = linearLogic.convertToNumChar('WK06');
    expect(numcharId).toBe('CCNN');
    numcharId = linearLogic.convertToNumChar('211H');
    expect(numcharId).toBe('NNNC');
  });
});

describe('get prefix from serviceId', function() {
  it('for service ID, work out prefix', function() {
    let serviceIdPrefix = linearLogic.getPrefixFromServiceId('2601');
    expect(serviceIdPrefix).toBe('26');
    serviceIdPrefix = linearLogic.getPrefixFromServiceId('WK06');
    expect(serviceIdPrefix).toBe('WK');
    serviceIdPrefix = linearLogic.getPrefixFromServiceId('211H');
    expect(serviceIdPrefix).toBe('2');
    serviceIdPrefix = linearLogic.getPrefixFromServiceId('F02');
    expect(serviceIdPrefix).toBe('F');
  });
});

describe('get suffix from serviceId', function() {
  it('for service ID, work out suffix', function() {
    let serviceIdSuffix = linearLogic.getSuffixFromServiceId('2601');
    expect(serviceIdSuffix).toBe('1');
    serviceIdSuffix = linearLogic.getSuffixFromServiceId('WK06');
    expect(serviceIdSuffix).toBe('6');
    serviceIdSuffix = linearLogic.getSuffixFromServiceId('211H');
    expect(serviceIdSuffix).toBe('1');
    serviceIdSuffix = linearLogic.getSuffixFromServiceId('F02');
    expect(serviceIdSuffix).toBe('2');
  });
});

describe('get suffix from serviceId', function() {
  it('for service ID, work out suffix', function() {
    let direction = linearLogic.getDirectionFromId('2601');
    expect(direction).toBe('DOWN');
    direction = linearLogic.getDirectionFromId('WK06');
    expect(direction).toBe('UP');
    direction = linearLogic.getDirectionFromId('211H');
    expect(direction).toBe('DOWN');
    direction = linearLogic.getDirectionFromId('F02');
    expect(direction).toBe('UP');
  });
});

describe('get operator from serviceId', function() {
  it('for service ID, work out operator', function() {
    let operator = linearLogic.getOperatorFromServiceId('2601');
    expect(operator).toBe('TDW');
    operator = linearLogic.getOperatorFromServiceId('WK06');
    expect(operator).toBe('TDW');
    operator = linearLogic.getOperatorFromServiceId('211H');
    expect(operator).toBe('KIWIRAIL');
    operator = linearLogic.getOperatorFromServiceId('WT01');
    expect(operator).toBe('KIWIRAIL');
  });
});

describe('get metlink line Id from serviceId', function() {
  it('for service ID, work out metlink line Id', function() {
    let metlinkLineId = linearLogic.getMetlinkLineFromId('2601');
    expect(metlinkLineId).toBe('HVL');
    metlinkLineId = linearLogic.getMetlinkLineFromId('WK06');
    expect(metlinkLineId).toBe('KPL');
    metlinkLineId = linearLogic.getMetlinkLineFromId('211H');
    expect(metlinkLineId).toBe('KPL');
    metlinkLineId = linearLogic.getMetlinkLineFromId('WT01');
    expect(metlinkLineId).toBe('');
  });
});

describe('check correct line', function() {
  it('see if there seems to be a point on another line which is closer', function() {
    // actually on JVL
    let thislocation = {
      lat: -41.251132,
      long: 174.771712,
      kiwirailLineId: 'WRAPA',
    };
    expect(linearLogic.checkCorrectLine(thislocation)).toBe(false);

    thislocation = {
      lat: -41.251132,
      long: 174.771712,
      kiwirailLineId: 'JVILL',
    };
    expect(linearLogic.checkCorrectLine(thislocation)).toBe(true);
  });
});

